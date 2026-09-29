-- ============================================================
-- Bootstrap manual do schema (PostgreSQL) - GERADO A MAO
-- ============================================================
-- Este script NAO substitui o EF Core Migrations - ele existe porque este
-- ambiente de sandbox nao tem o .NET SDK / acesso ao NuGet pra rodar
-- `dotnet ef migrations add` de verdade. Rode isso uma vez no seu Postgres
-- local pra ter o banco de pe agora.
--
-- Assim que tiver o projeto rodando na sua maquina, rode:
--   dotnet ef migrations add InitialCreate
-- A partir dai, o C# (Models/ + Data/AppDbContext.cs) e que manda - use
-- esse comando pra gerar a migration oficial e trate este arquivo soh como
-- ponto de partida.

CREATE TABLE albuns (
    id                  BIGSERIAL    PRIMARY KEY,
    nome                VARCHAR(120) NOT NULL,
    descricao           VARCHAR(500),
    total               INT,
    is_finalized        BOOLEAN      NOT NULL DEFAULT FALSE,
    is_principal        BOOLEAN      NOT NULL DEFAULT FALSE,
    permite_gameplay    BOOLEAN      NOT NULL DEFAULT TRUE,
    sub_album_id        BIGINT       REFERENCES albuns(id),
    imagem_capa         VARCHAR(255),
    data_inicio         TIMESTAMP,
    data_fim            TIMESTAMP,
    criado_em           TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE raridades (
    id              VARCHAR(64)   PRIMARY KEY,
    album_id        BIGINT        NOT NULL REFERENCES albuns(id),
    nome            VARCHAR(60)   NOT NULL,
    cor_hex         VARCHAR(7),
    ordem           INT           NOT NULL DEFAULT 0,
    peso            INT           NOT NULL
);
CREATE INDEX idx_raridades_album ON raridades(album_id);

CREATE TABLE figurinhas (
    id              VARCHAR(64)   PRIMARY KEY,
    album_id        BIGINT        NOT NULL REFERENCES albuns(id),
    raridade_id     VARCHAR(64)   NOT NULL REFERENCES raridades(id),
    nome            VARCHAR(120)  NOT NULL,
    imagem_url      VARCHAR(255),
    is_secreta      BOOLEAN       NOT NULL DEFAULT FALSE,
    is_trofeu       BOOLEAN       NOT NULL DEFAULT FALSE,
    passiva_desc    VARCHAR(255),
    passiva         JSONB         -- qualquer string vira JSON valido (serializada antes de gravar)
);
CREATE INDEX idx_figurinhas_album ON figurinhas(album_id);

CREATE TABLE tipos_pacote (
    id              VARCHAR(64)   PRIMARY KEY,
    album_id        BIGINT        NOT NULL REFERENCES albuns(id),
    nome            VARCHAR(120)  NOT NULL,
    template        VARCHAR(60),
    custo_moedas    BIGINT,
    regras_drop     JSONB         NOT NULL,
    ativo           BOOLEAN       NOT NULL DEFAULT TRUE
);

CREATE TABLE usuarios (
    id              BIGSERIAL     PRIMARY KEY,
    nome            VARCHAR(100)  NOT NULL UNIQUE,
    email           VARCHAR(180),
    senha_hash      VARCHAR(255)  NOT NULL,
    papel           VARCHAR(20)   NOT NULL DEFAULT 'Usuario',
    saldo_moedas    BIGINT        NOT NULL DEFAULT 0,
    criado_em       TIMESTAMP     NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE usuario_inventario (
    id              BIGSERIAL     PRIMARY KEY,
    usuario_id      BIGINT        NOT NULL REFERENCES usuarios(id),
    figurinha_id    VARCHAR(64)   NOT NULL REFERENCES figurinhas(id),
    quantidade      INT           NOT NULL DEFAULT 0,
    atualizado_em   TIMESTAMP     NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, figurinha_id)
);

CREATE TABLE usuario_pacotes (
    id              BIGSERIAL     PRIMARY KEY,
    usuario_id      BIGINT        NOT NULL REFERENCES usuarios(id),
    tipo_pacote_id  VARCHAR(64)   NOT NULL REFERENCES tipos_pacote(id),
    quantidade      INT           NOT NULL DEFAULT 0,
    atualizado_em   TIMESTAMP     NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, tipo_pacote_id)
);

CREATE TABLE pacotes_concedidos (
    id              BIGSERIAL     PRIMARY KEY,
    usuario_id      BIGINT        NOT NULL REFERENCES usuarios(id),
    tipo_pacote_id  VARCHAR(64)   NOT NULL REFERENCES tipos_pacote(id),
    quantidade      INT           NOT NULL,
    origem          VARCHAR(60)   NOT NULL,
    criado_em       TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pacotesconcedidos_usuario ON pacotes_concedidos(usuario_id);

CREATE TABLE mercado_trocas (
    id                      BIGSERIAL   PRIMARY KEY,
    de_usuario_id           BIGINT      NOT NULL REFERENCES usuarios(id),
    para_usuario_id         BIGINT      REFERENCES usuarios(id),
    oferece_figurinha_id    VARCHAR(64) NOT NULL REFERENCES figurinhas(id),
    quer_figurinha_id       VARCHAR(64) NOT NULL REFERENCES figurinhas(id),
    status                  VARCHAR(20) NOT NULL DEFAULT 'Pendente',
    criado_em               TIMESTAMP   NOT NULL DEFAULT NOW(),
    respondido_em           TIMESTAMP
);
CREATE INDEX idx_trocas_status ON mercado_trocas(status);

CREATE TABLE missoes (
    id                          BIGSERIAL    PRIMARY KEY,
    album_id                    BIGINT       REFERENCES albuns(id),
    nome                        VARCHAR(120) NOT NULL,
    tipo_meta                   VARCHAR(60)  NOT NULL,
    meta_valor                  INT          NOT NULL,
    recompensa_tipo_pacote_id   VARCHAR(64)  REFERENCES tipos_pacote(id),
    recompensa_moedas           BIGINT,
    periodicidade               VARCHAR(20)  NOT NULL DEFAULT 'Semanal',
    ativo                       BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE missoes_progresso (
    id              BIGSERIAL    PRIMARY KEY,
    usuario_id      BIGINT       NOT NULL REFERENCES usuarios(id),
    missao_id       BIGINT       NOT NULL REFERENCES missoes(id),
    periodo_ref     VARCHAR(20)  NOT NULL,
    progresso       INT          NOT NULL DEFAULT 0,
    resgatado       BOOLEAN      NOT NULL DEFAULT FALSE,
    resgatado_em    TIMESTAMP,
    UNIQUE (usuario_id, missao_id, periodo_ref)
);

CREATE TABLE moeda_transacoes (
    id              BIGSERIAL    PRIMARY KEY,
    usuario_id      BIGINT       NOT NULL REFERENCES usuarios(id),
    tipo            VARCHAR(10)  NOT NULL,
    quantidade      BIGINT       NOT NULL,
    origem          VARCHAR(60)  NOT NULL,
    referencia_id   BIGINT,
    criado_em       TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_moedatransacoes_usuario ON moeda_transacoes(usuario_id);

CREATE TABLE itens_loja (
    id              BIGSERIAL     PRIMARY KEY,
    nome            VARCHAR(120)  NOT NULL,
    tipo            VARCHAR(20)   NOT NULL,
    figurinha_id    VARCHAR(64)   REFERENCES figurinhas(id),
    album_id        BIGINT        REFERENCES albuns(id),
    preco_moedas    BIGINT        NOT NULL,
    disponivel_de   TIMESTAMP,
    disponivel_ate  TIMESTAMP,
    ativo           BOOLEAN       NOT NULL DEFAULT TRUE
);

CREATE TABLE compras (
    id              BIGSERIAL    PRIMARY KEY,
    usuario_id      BIGINT       NOT NULL REFERENCES usuarios(id),
    item_loja_id    BIGINT       NOT NULL REFERENCES itens_loja(id),
    preco_pago      BIGINT       NOT NULL,
    criado_em       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE competicoes (
    id                  BIGSERIAL    PRIMARY KEY,
    nome                VARCHAR(120) NOT NULL,
    tipo                VARCHAR(60),
    status              VARCHAR(20)  NOT NULL DEFAULT 'Planejada',
    regras_pontuacao    JSONB        NOT NULL,
    data_inicio         TIMESTAMP,
    data_fim            TIMESTAMP,
    criado_em           TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE fases (
    id              BIGSERIAL    PRIMARY KEY,
    competicao_id   BIGINT       NOT NULL REFERENCES competicoes(id),
    nome            VARCHAR(120) NOT NULL,
    ordem           INT          NOT NULL DEFAULT 0,
    formato         VARCHAR(20)  NOT NULL
);

CREATE TABLE jogos (
    id              BIGSERIAL    PRIMARY KEY,
    fase_id         BIGINT       NOT NULL REFERENCES fases(id),
    mandante        VARCHAR(120) NOT NULL,
    visitante       VARCHAR(120) NOT NULL,
    data_hora       TIMESTAMP    NOT NULL,
    gols_mandante   INT,
    gols_visitante  INT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'Agendado'
);
CREATE INDEX idx_jogos_fase ON jogos(fase_id);

CREATE TABLE palpites (
    id                  BIGSERIAL    PRIMARY KEY,
    usuario_id          BIGINT       NOT NULL REFERENCES usuarios(id),
    jogo_id             BIGINT       NOT NULL REFERENCES jogos(id),
    palpite_mandante    INT          NOT NULL,
    palpite_visitante   INT          NOT NULL,
    pontos_obtidos      INT,
    criado_em           TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, jogo_id)
);

CREATE TABLE bracket_predicoes (
    id                      BIGSERIAL    PRIMARY KEY,
    usuario_id              BIGINT       NOT NULL REFERENCES usuarios(id),
    competicao_id           BIGINT       NOT NULL REFERENCES competicoes(id),
    payload                 JSONB        NOT NULL,
    pontos_realizados       INT          NOT NULL DEFAULT 0,
    premios_resgatados      JSONB,
    atualizado_em           TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, competicao_id)
);

CREATE TABLE chat_mensagens (
    id              BIGSERIAL    PRIMARY KEY,
    usuario_id      BIGINT       NOT NULL REFERENCES usuarios(id),
    mensagem        VARCHAR(500) NOT NULL,
    criado_em       TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_chat_criado ON chat_mensagens(criado_em);

CREATE TABLE logs (
    id              BIGSERIAL     PRIMARY KEY,
    nivel           VARCHAR(20)   NOT NULL,
    usuario_id      BIGINT        REFERENCES usuarios(id),
    mensagem        VARCHAR(1000) NOT NULL,
    criado_em       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE reset_senha_solicitacoes (
    id              BIGSERIAL    PRIMARY KEY,
    usuario_id      BIGINT       NOT NULL REFERENCES usuarios(id),
    codigo          VARCHAR(10)  NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'Pendente',
    criado_em       TIMESTAMP    NOT NULL DEFAULT NOW()
);
