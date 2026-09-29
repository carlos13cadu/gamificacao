using System.Net;
using GamificacaoApi.Admin.Dto;
using GamificacaoApi.Albuns;
using GamificacaoApi.Albuns.Dto;
using GamificacaoApi.Common;
using GamificacaoApi.Data;
using GamificacaoApi.Models;
using Microsoft.EntityFrameworkCore;

namespace GamificacaoApi.Admin;

/// <summary>
/// Endpoint agregado da Fabrica de Albuns: recebe o "estado inteiro" do
/// album (raridades + figurinhas + pacotes aninhados) e sincroniza com o
/// banco - insere o que e novo, atualiza o que existe, remove o que sumiu
/// do payload (respeitando as travas abaixo). Tudo numa unica transacao.
///
/// Ordem de sincronizacao importa: Figurinhas ANTES de Raridades, porque
/// uma raridade so pode ser removida se nenhuma figurinha (no estado FINAL,
/// pos-sincronizacao) ainda a referencia.
///
/// Travas de remocao, da mais forte pra mais fraca:
///   1) Figurinha com IsTrofeu == true - nunca remove, mesmo sem uso.
///   2) Album ja estava IsFinalized ANTES deste save - bloqueia qualquer
///      remocao de filho (raridade/figurinha/pacote), so permite adicionar.
///   3) Fora isso - remove so se nada estiver referenciando (inventario,
///      troca, loja, missao, pacotes concedidos/em posse).
/// </summary>
public class AlbumAdminService(AppDbContext db, AlbumService albumService)
{
    public async Task<AlbumDetalheResponse> CriarAsync(AlbumSalvarRequest request)
    {
        await using var transacao = await db.Database.BeginTransactionAsync();

        ValidarIntegridadeDoPayload(request);
        await ValidarSubAlbumAsync(request.SubAlbumId, idAtual: null);

        var album = new Models.Album
        {
            Nome = request.Name,
            Descricao = request.Desc,
            Total = request.Total,
            IsFinalized = request.IsFinalized,
            IsPrincipal = request.IsPrincipal,
            PermiteGameplay = request.PermiteGameplay,
            SubAlbumId = request.SubAlbumId
        };
        db.Albuns.Add(album);
        await db.SaveChangesAsync(); // precisa persistir primeiro pra saber o Id gerado

        if (request.IsPrincipal)
        {
            await DesmarcarOutrosPrincipaisAsync(album.Id);
        }

        // eraFinalizadoAntes = false sempre aqui - album acabou de nascer, nao tem
        // filho antigo pra bloquear remocao (mas o payload de criacao tambem nao
        // deveria vir com remocoes, ja que nao existe nada antes).
        await SincronizarFigurinhasAsync(album.Id, request.Stickers, eraFinalizadoAntes: false);
        await SincronizarRaridadesAsync(album.Id, request.Rarities, eraFinalizadoAntes: false);
        await SincronizarPacotesAsync(album.Id, request.Packs, eraFinalizadoAntes: false);

        await db.SaveChangesAsync();
        await transacao.CommitAsync();

        return await albumService.GetCatalogoAsync(album.Id);
    }

    public async Task<AlbumDetalheResponse> AtualizarAsync(long id, AlbumSalvarRequest request)
    {
        await using var transacao = await db.Database.BeginTransactionAsync();

        ValidarIntegridadeDoPayload(request);
        await ValidarSubAlbumAsync(request.SubAlbumId, idAtual: id > 0 ? id : null);

        var album = await db.Albuns.FirstOrDefaultAsync(a => a.Id == id);
        
        bool isNovo = false;
        bool eraFinalizadoAntes = false;

        if (album == null)
        {
            // 🚀 O SEGREDO ESTÁ AQUI: Como o PostgreSQL não gera sozinho, o C# calcula o próximo ID!
            long proximoId = id;
            if (proximoId <= 0) 
            {
                // Pega o maior ID que já existe no banco e soma 1
                var maxId = await db.Albuns.MaxAsync(a => (long?)a.Id) ?? 0;
                proximoId = maxId + 1;
            }

            album = new Models.Album
            {
                Id = proximoId, // Agora passamos o ID calculado obrigatoriamente para o banco
                Nome = request.Name,
                Descricao = request.Desc,
                Total = request.Total,
                IsFinalized = request.IsFinalized,
                IsPrincipal = request.IsPrincipal,
                PermiteGameplay = request.PermiteGameplay,
                SubAlbumId = request.SubAlbumId
            };
            db.Albuns.Add(album);
            isNovo = true;
            
            // 🚀 Atualiza a variável 'id' para que as figurinhas e pacotes usem esse novo número
            id = proximoId; 
        }
        else
        {
            eraFinalizadoAntes = album.IsFinalized;
            
            album.Nome = request.Name;
            album.Descricao = request.Desc;
            album.Total = request.Total;
            album.IsFinalized = request.IsFinalized;
            album.IsPrincipal = request.IsPrincipal;
            album.PermiteGameplay = request.PermiteGameplay;
            album.SubAlbumId = request.SubAlbumId;
        }

        if (isNovo)
        {
            // Persiste o álbum pai primeiro
            await db.SaveChangesAsync(); 
        }

        if (request.IsPrincipal)
        {
            await DesmarcarOutrosPrincipaisAsync(id);
        }

        // Sincroniza os filhos usando a variável 'id' (que agora tem o valor correto)
        await SincronizarFigurinhasAsync(id, request.Stickers, eraFinalizadoAntes);
        await SincronizarRaridadesAsync(id, request.Rarities, eraFinalizadoAntes);
        await SincronizarPacotesAsync(id, request.Packs, eraFinalizadoAntes);

        await db.SaveChangesAsync();
        await transacao.CommitAsync();

        return await albumService.GetCatalogoAsync(id);
    }

    // NOVO MÉTODO: Deleta o álbum e garante as regras de negócio
    public async Task DeletarAsync(long id)
    {
        var album = await db.Albuns.FirstOrDefaultAsync(a => a.Id == id);
        
        if (album is null)
        {
            throw new RegraNegocioException("ALBUM_NAO_ENCONTRADO", "O álbum informado não existe.", HttpStatusCode.NotFound);
        }

        if (album.IsFinalized)
        {
            throw new RegraNegocioException("ALBUM_FINALIZADO", "Não é possível deletar um álbum que já foi finalizado.", HttpStatusCode.Conflict);
        }

        // 🚀 RESOLVENDO O ERRO DO POSTGRES (Exclusão em Cascata Manual)
        // Buscamos todos os filhos atrelados a este álbum
        var pacotes = await db.TiposPacote.Where(p => p.AlbumId == id).ToListAsync();
        var figurinhas = await db.Figurinhas.Where(f => f.AlbumId == id).ToListAsync();
        var raridades = await db.Raridades.Where(r => r.AlbumId == id).ToListAsync();

        // Deletamos os filhos primeiro
        db.TiposPacote.RemoveRange(pacotes);
        db.Figurinhas.RemoveRange(figurinhas);
        db.Raridades.RemoveRange(raridades);

        // Agora sim, sem nenhum filho prendendo, deletamos o pai
        db.Albuns.Remove(album);
        
        await db.SaveChangesAsync();
    }

    private async Task ValidarSubAlbumAsync(long? subAlbumId, long? idAtual)
    {
        if (subAlbumId is null) return;

        if (subAlbumId == idAtual)
        {
            throw new RegraNegocioException(
                "SUB_ALBUM_INVALIDO", "Um album nao pode ser sub-album de si mesmo", HttpStatusCode.BadRequest);
        }

        bool subAlbumExiste = await db.Albuns.AnyAsync(a => a.Id == subAlbumId);
        if (!subAlbumExiste)
        {
            throw new RegraNegocioException(
                "SUB_ALBUM_NAO_ENCONTRADO", "O sub-album informado nao existe", HttpStatusCode.BadRequest);
        }
    }

    private async Task DesmarcarOutrosPrincipaisAsync(long albumId)
    {
        var outrosPrincipais = await db.Albuns
            .Where(a => a.IsPrincipal && a.Id != albumId)
            .ToListAsync();
        foreach (var outro in outrosPrincipais) outro.IsPrincipal = false;
    }

    private static void ValidarIntegridadeDoPayload(AlbumSalvarRequest request)
    {
        var raridadeIds = request.Rarities.Select(r => r.Id).ToHashSet();
        foreach (var sticker in request.Stickers)
        {
            if (!raridadeIds.Contains(sticker.RarityId))
            {
                throw new RegraNegocioException(
                    "RARIDADE_INVALIDA_NO_PAYLOAD",
                    $"A figurinha '{sticker.Id}' referencia a raridade '{sticker.RarityId}', que nao esta na lista de raridades enviada",
                    HttpStatusCode.BadRequest);
            }
        }
    }

    private async Task SincronizarRaridadesAsync(long albumId, List<RaridadeSalvarRequest> incoming, bool eraFinalizadoAntes)
    {
        var existentes = await db.Raridades.Where(r => r.AlbumId == albumId).ToListAsync();
        var incomingIds = incoming.Select(r => r.Id).ToHashSet();

        for (int i = 0; i < incoming.Count; i++)
        {
            var item = incoming[i];
            var existente = existentes.FirstOrDefault(r => r.Id == item.Id);
            if (existente is null)
            {
                db.Raridades.Add(new Raridade
                {
                    Id = item.Id,
                    AlbumId = albumId,
                    Nome = item.Name,
                    CorHex = item.Color,
                    Peso = item.Weight,
                    Ordem = i // derivada da posicao no array - o front nao manda esse campo
                });
            }
            else
            {
                existente.Nome = item.Name;
                existente.CorHex = item.Color;
                existente.Peso = item.Weight;
                existente.Ordem = i;
            }
        }

        foreach (var raridade in existentes.Where(r => !incomingIds.Contains(r.Id)))
        {
            if (eraFinalizadoAntes)
            {
                throw new RegraNegocioException(
                    "ALBUM_FINALIZADO_NAO_PERMITE_REMOCAO",
                    $"O album ja foi finalizado - a raridade '{raridade.Nome}' nao pode ser removida",
                    HttpStatusCode.Conflict);
            }

            // checa contra o estado JA sincronizado de figurinhas (rodou antes desta)
            bool referenciada = await db.Figurinhas.AnyAsync(f => f.RaridadeId == raridade.Id);
            if (referenciada)
            {
                throw new RegraNegocioException(
                    "ITEM_EM_USO_NAO_PODE_SER_REMOVIDO",
                    $"A raridade '{raridade.Nome}' ainda tem figurinhas vinculadas e nao pode ser removida",
                    HttpStatusCode.Conflict);
            }

            db.Raridades.Remove(raridade);
        }
    }

    private async Task SincronizarFigurinhasAsync(long albumId, List<FigurinhaSalvarRequest> incoming, bool eraFinalizadoAntes)
    {
        var existentes = await db.Figurinhas.Where(f => f.AlbumId == albumId).ToListAsync();
        var incomingIds = incoming.Select(s => s.Id).ToHashSet();

        foreach (var item in incoming)
        {
            var existente = existentes.FirstOrDefault(f => f.Id == item.Id);
            if (existente is null)
            {
                db.Figurinhas.Add(new Figurinha
                {
                    Id = item.Id,
                    AlbumId = albumId,
                    RaridadeId = item.RarityId,
                    Nome = item.Name,
                    ImagemUrl = item.Image,
                    IsSecreta = item.IsSecret,
                    IsTrofeu = item.IsTrophy ?? false,
                    PassivaDesc = item.PassiveDesc,
                    Passiva = item.PassiveRule
                });
            }
            else
            {
                // Trofeu e irreversivel por design - uma vez marcada, nao desmarca
                // (evita a brecha de "desmarcar pra depois poder deletar").
                bool jaEraTrofeu = existente.IsTrofeu;

                existente.RaridadeId = item.RarityId;
                existente.Nome = item.Name;
                existente.ImagemUrl = item.Image;
                existente.IsSecreta = item.IsSecret;
                existente.IsTrofeu = jaEraTrofeu || (item.IsTrophy ?? false);
                existente.PassivaDesc = item.PassiveDesc;
                existente.Passiva = item.PassiveRule;
            }
        }

        foreach (var figurinha in existentes.Where(f => !incomingIds.Contains(f.Id)))
        {
            if (figurinha.IsTrofeu)
            {
                throw new RegraNegocioException(
                    "FIGURINHA_TROFEU_NAO_PODE_SER_REMOVIDA",
                    $"A figurinha '{figurinha.Nome}' e um trofeu e nunca pode ser removida",
                    HttpStatusCode.Conflict);
            }

            if (eraFinalizadoAntes)
            {
                throw new RegraNegocioException(
                    "ALBUM_FINALIZADO_NAO_PERMITE_REMOCAO",
                    $"O album ja foi finalizado - a figurinha '{figurinha.Nome}' nao pode ser removida",
                    HttpStatusCode.Conflict);
            }

            bool referenciada =
                await db.UsuarioInventarios.AnyAsync(inv => inv.FigurinhaId == figurinha.Id) ||
                await db.MercadoTrocas.AnyAsync(t => t.OfereceFigurinhasIds.Contains(figurinha.Id) || t.QuerFigurinhasIds.Contains(figurinha.Id)) ||
                await db.ItensLoja.AnyAsync(l => l.FigurinhaId == figurinha.Id);

            if (referenciada)
            {
                throw new RegraNegocioException(
                    "ITEM_EM_USO_NAO_PODE_SER_REMOVIDO",
                    $"A figurinha '{figurinha.Nome}' esta em uso (inventario, troca ou loja) e nao pode ser removida",
                    HttpStatusCode.Conflict);
            }

            db.Figurinhas.Remove(figurinha);
        }
    }

    private async Task SincronizarPacotesAsync(long albumId, List<PacoteSalvarRequest> incoming, bool eraFinalizadoAntes)
    {
        var existentes = await db.TiposPacote.Where(t => t.AlbumId == albumId).ToListAsync();
        var incomingIds = incoming.Select(p => p.Id).ToHashSet();

        foreach (var item in incoming)
        {
            var regrasDrop = new RegrasDrop
            {
                Amount = item.Amount,
                Behavior = item.Behavior,
                Drops = item.Drops,
                BonusTiers = item.BonusTiers?
                    .Select(b => new BonusTier { Chance = b.Chance, Amount = b.Amount })
                    .ToList() ?? [],
                AdvancedRule = null // campo nao esta no contrato TS atual - fica pronto pro futuro
            };

            var existente = existentes.FirstOrDefault(t => t.Id == item.Id);
            if (existente is null)
            {
                db.TiposPacote.Add(new TipoPacote
                {
                    Id = item.Id,
                    AlbumId = albumId,
                    Nome = item.Name,
                    Template = item.Template,
                    RegrasDrop = regrasDrop,
                    Ativo = true
                });
            }
            else
            {
                existente.Nome = item.Name;
                existente.Template = item.Template;
                existente.RegrasDrop = regrasDrop;
            }
        }

        foreach (var pacote in existentes.Where(t => !incomingIds.Contains(t.Id)))
        {
            if (eraFinalizadoAntes)
            {
                throw new RegraNegocioException(
                    "ALBUM_FINALIZADO_NAO_PERMITE_REMOCAO",
                    $"O album ja foi finalizado - o pacote '{pacote.Nome}' nao pode ser removido",
                    HttpStatusCode.Conflict);
            }

            bool referenciado =
                await db.UsuarioPacotes.AnyAsync(p => p.TipoPacoteId == pacote.Id && p.Quantidade > 0) ||
                await db.PacotesConcedidos.AnyAsync(p => p.TipoPacoteId == pacote.Id) ||
                await db.Missoes.AnyAsync(m => m.RecompensaTipoPacoteId == pacote.Id);

            if (referenciado)
            {
                throw new RegraNegocioException(
                    "ITEM_EM_USO_NAO_PODE_SER_REMOVIDO",
                    $"O pacote '{pacote.Nome}' esta em uso e nao pode ser removido",
                    HttpStatusCode.Conflict);
            }

            db.TiposPacote.Remove(pacote);
        }
    }
}
