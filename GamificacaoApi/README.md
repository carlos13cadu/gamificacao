# Gamificação Aperam — Backend (C# / .NET / PostgreSQL)

Migração da versão em Java/Spring Boot/MySQL para C#/.NET/PostgreSQL — decisão
oficial do projeto. O desenho de dados e as regras de negócio são os mesmos
(só a implementação mudou); ver histórico da conversa pra entender o "porquê"
de cada decisão.

## Convenção de nomes da API

Os campos JSON de tudo que toca o "ecossistema Álbum" (álbum, raridade,
figurinha, pacote) seguem o contrato TypeScript confirmado pelo front-end —
**em inglês** (`name`, `desc`, `rarities`, `stickers`, `packs`, `rarityId`,
`isSecret`, `isTrophy`, `passiveDesc`, `passiveRule`, `weight`, `color`...).
O resto da API (auth, usuários) continua em português. Isso é proposital,
não inconsistência — é o que bate com o que o front realmente envia.

## Estrutura do projeto

- `Models/` — as entidades (equivalente às entidades JPA de antes). Nomes de
  propriedade em português internamente; o mapeamento pro JSON em inglês
  acontece nos DTOs (`[JsonPropertyName]`), não nas entidades.
- `Models/RegrasDrop.cs` — espelha o JSON de cada tipo de pacote (`amount`,
  `behavior`, `drops`, `bonusTiers`, `advancedRule`).
- `Data/AppDbContext.cs` — toda a configuração do schema. É a fonte de
  verdade do banco.
- `Security/` — geração/validação de JWT.
- `Common/` — tratamento de erro padronizado (`{ "mensagem": "...", "codigo": "..." }`).
- `Auth/` — registro e login.
- `Usuarios/` — endpoint protegido de perfil (valida o fluxo JWT).
- `Album/` — leitura: listar álbuns, catálogo (com sub-álbum aninhado),
  inventário do usuário.
- `Pacote/` — abrir pacote (sorteio) e conceder pacote (integração/minigames).
- `Admin/` — o endpoint agregado da Fábrica de Álbuns (salvar tudo de uma vez).
- `scripts/schema-bootstrap.sql` — **script manual** que espelha o schema das
  entidades. Ver nota abaixo.

### Nota sobre o `schema-bootstrap.sql`

O ambiente onde estou trabalhando não tem o SDK do .NET instalado (nem acesso
à internet pra baixar), então não consegui rodar `dotnet ef migrations add`
de verdade pra gerar a migration oficial — escrevi esse SQL à mão, espelhando
as entidades. **Assim que você tiver o projeto rodando localmente**, rode:
```
dotnet ef migrations add InitialCreate
```
Isso gera a migration oficial a partir do `AppDbContext` — trate esse arquivo
como o ponto de partida pra destravar os testes agora, não como fonte de
verdade permanente.

## Pré-requisitos

- **.NET 10 SDK** (LTS) — [dotnet.microsoft.com/download](https://dotnet.microsoft.com/download).
- **PostgreSQL** rodando localmente, com o pgAdmin (equivalente do Workbench).
- **Editor**: VS Code com a extensão **"C# Dev Kit"**, ou Visual Studio Community.

## Como rodar localmente

### 1. Criar o banco e um usuário dedicado (só na primeira vez)
```sql
CREATE DATABASE gamificacao;
CREATE USER gamificacao_app WITH PASSWORD 'uma-senha-sua';
GRANT ALL PRIVILEGES ON DATABASE gamificacao TO gamificacao_app;
```
```sql
\c gamificacao
GRANT ALL ON SCHEMA public TO gamificacao_app;
```

### 2. Rodar o bootstrap do schema

**Se você já tinha rodado uma versão anterior deste script** (o schema mudou
de novo - `albuns.id` voltou a ser gerado pelo banco, e `passiva` voltou a
ser `jsonb`), reseta tudo antes:
```sql
DROP TABLE IF EXISTS pacotes_concedidos, usuario_pacotes, compras, itens_loja,
  moeda_transacoes, missoes_progresso, missoes, mercado_trocas,
  usuario_inventario, bracket_predicoes, palpites, jogos, fases, competicoes,
  reset_senha_solicitacoes, logs, chat_mensagens, tipos_pacote, figurinhas,
  raridades, albuns, usuarios CASCADE;
```
Depois rode `scripts/schema-bootstrap.sql` inteiro, e de novo o `GRANT ALL
PRIVILEGES ON ALL TABLES/SEQUENCES IN SCHEMA public TO gamificacao_app`
(as tabelas nascem de novo, o dono volta a ser quem rodou o bootstrap).

### 3. Configurar a conexão
Ajuste `appsettings.json` → `ConnectionStrings:Default` com a senha real.

### 4. Rodar
```
dotnet restore
dotnet run
```
A API sobe em `http://localhost:5000`.

### 5. Promover um usuário a Admin (pra testar a Fábrica de Álbuns)
Ainda não existe um endpoint pra isso — é manual por enquanto:
```sql
UPDATE usuarios SET papel = 'Admin' WHERE nome = 'carlos';
```
Depois disso, **é preciso logar de novo** (`POST /auth/login`) pra pegar um
token novo — o papel fica gravado dentro do token no momento do login, não é
reconsultado no banco a cada chamada.

## Endpoints prontos nesta etapa

**Auth**
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- `GET /api/v1/usuarios/me` (protegido)

**Álbum (leitura)**
- `GET /api/v1/albuns` — lista leve de todos os álbuns
- `GET /api/v1/albuns/principal` — catálogo do álbum com `isPrincipal: true` (+ sub-álbum aninhado)
- `GET /api/v1/albuns/{id}` — catálogo de um álbum específico
- `GET /api/v1/albuns/{id}/inventario` — figurinhas/pacotes que o usuário logado possui

**Pacote**
- `POST /api/v1/pacotes/abrir` — body: `{ "packId": "p_1" }`
- `POST /api/v1/albuns/pacotes/conceder` — Admin only, body: `{ "userId": 1, "packId": "p_1", "quantity": 1, "origin": "minigame" }`

**Admin — Fábrica de Álbuns**
- `POST /api/v1/admin/albuns` — Admin only, cria um álbum novo (o `id` é
  gerado pelo banco e vem na resposta).
- `PUT /api/v1/admin/albuns/{id}` — Admin only, atualiza um álbum existente
  (payload = as interfaces TS `Album`/`Rarity`/`Pack`/`StickerDef`
  confirmadas com o front, sem o campo `id` — esse já vem da URL agora).
  Sincroniza raridades/figurinhas/pacotes contra o banco numa transação só,
  bloqueando remoção de qualquer coisa: marcada como troféu (`isTrophy`), já
  em uso (inventário/troca/loja/missão/pacote concedido), ou se o álbum já
  estava `isFinalized` antes deste save.

### Como testar a Fábrica de Álbuns

1. Promova seu usuário a Admin (passo 5 acima) e logue de novo.
2. `POST http://localhost:5000/api/v1/admin/albuns` com um body no formato
   do exemplo que o Gemini confirmou (álbum + `rarities` + `packs` +
   `stickers`, sem o campo `id`). Deve voltar `201` com o catálogo salvo,
   incluindo o `id` que o banco gerou — guarda esse id.
3. Confira no pgAdmin se as tabelas `albuns`, `raridades`, `figurinhas`,
   `tipos_pacote` foram populadas.
4. `PUT http://localhost:5000/api/v1/admin/albuns/{id}` (o id do passo 2)
   com o mesmo payload, mas com uma raridade a menos na lista — se ela não
   tiver figurinha nenhuma vinculada, deve remover sem erro. Se tiver, deve
   voltar `409` com `ITEM_EM_USO_NAO_PODE_SER_REMOVIDO`.
5. `GET /api/v1/albuns/principal` deve devolver esse mesmo álbum, se
   `isPrincipal: true` foi enviado.

**Síntese**
- `POST /api/v1/sintese/simular` — body: `{ "stickerIds": ["s_1","s_2","s_3"], "catalystId": "s_9" }` (catalyst
  opcional). Devolve `{ "successChance": 0.35, "sameChance": 0.64, "jumpChance": 0.01 }` sem consumir nada.
- `POST /api/v1/sintese/executar` — mesmo body, consome as figurinhas de
  verdade e credita o(s) resultado(s). Devolve
  `{ "status": "upgrade" | "same" | "jump", "results": [...] }`.

Regras: sempre 3 figurinhas base (2+ cópias cada, 1ª protegida), diferença
de raridade entre elas ≤ 2 níveis, nunca abaixo da mais fraca usada. Peso
`< 100` = raridade padrão (participa normal); `100-199` = secreta premiável
(só sai como bônus raro, nunca é ingrediente); `≥ 200` = banida (troféu).
Catalisador: mesma raridade da mais fraca ou 1 nível abaixo, nunca a
raridade padrão mais alta.

## Fora do escopo desta etapa (próximos passos)

- **Forja** — a variante mais arriscada/legada (com chance de "explodir" e
  perder tudo), parecida com a Síntese mas com regras próprias.
- Loja, mercado de trocas, missões, competições, chat, migração dos dados
  antigos.
- Autenticação servico-a-servico pra minigames chamarem `pacotes/conceder`
  sem ser via Admin logado (hoje é admin-only, como paliativo).
