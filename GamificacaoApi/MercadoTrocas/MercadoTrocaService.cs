using System.Net;
using GamificacaoApi.MercadoTrocas.Dto;
using GamificacaoApi.Common;
using GamificacaoApi.Data;
using GamificacaoApi.Models;
using GamificacaoApi.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace GamificacaoApi.MercadoTrocas;

public class MercadoTrocaService(AppDbContext db)
{
    private const int LIMITE_TROCA = 8; 

    public async Task<List<MapeamentoUsuarioResponse>> GetMapeamentoAsync(long usuarioLogadoId, long albumId)
    {
        var album = await db.Albuns.FindAsync(albumId) 
            ?? throw new RegraNegocioException("ALBUM_NAO_ENCONTRADO", "Álbum não encontrado", HttpStatusCode.NotFound);

        var figurinhasTrocaveis = await db.Figurinhas
            .Where(f => f.AlbumId == albumId && !f.IsSecreta && !f.IsTrofeu)
            .Select(f => f.Id)
            .ToListAsync();

        var todosInventarios = await db.UsuarioInventarios
            .Where(i => i.Figurinha!.AlbumId == albumId && figurinhasTrocaveis.Contains(i.FigurinhaId) && i.Quantidade > 0)
            .ToListAsync();

        var meuInventario = todosInventarios.Where(i => i.UsuarioId == usuarioLogadoId).ToDictionary(i => i.FigurinhaId, i => i.Quantidade);
        
        // 🚀 FIX: Agora sim, se não é o álbum principal, é garantidamente o Legado!
        bool isLegado = !album.IsPrincipal; 

        var todosUsuarios = await db.Usuarios.Where(u => u.Id != usuarioLogadoId).ToListAsync();
        var mapa = new List<MapeamentoUsuarioResponse>();

        foreach (var u in todosUsuarios)
        {
            var invAlvo = todosInventarios.Where(i => i.UsuarioId == u.Id).ToDictionary(i => i.FigurinhaId, i => i.Quantidade);
            int alvoTotalUnicas = invAlvo.Count;
            bool alvoAlbumCompleto = alvoTotalUnicas >= album.Total;

            bool temRepetida = false;
            bool temUtilPraMim = false;

            foreach (var item in invAlvo)
            {
                int bloqueadas = (isLegado || alvoAlbumCompleto) ? 1 : 0;
                int livre = item.Value - bloqueadas;

                if (livre > 0)
                {
                    temRepetida = true;
                    if (!meuInventario.ContainsKey(item.Key))
                    {
                        temUtilPraMim = true;
                    }
                }
            }

            mapa.Add(new MapeamentoUsuarioResponse(u.Id, u.Nome, temRepetida, temUtilPraMim));
        }

        return mapa;
    }

    public async Task CriarPropostaAsync(long deUsuarioId, NovaTrocaRequest req)
    {
        if (req.OfereceIds.Count == 0 || req.QuerIds.Count == 0)
            throw new RegraNegocioException("TROCA_VAZIA", "Ofereça e peça pelo menos 1 figurinha.", HttpStatusCode.BadRequest);

        if (req.OfereceIds.Count > LIMITE_TROCA || req.QuerIds.Count > LIMITE_TROCA)
            throw new RegraNegocioException("LIMITE_EXCEDIDO", $"O limite máximo é de {LIMITE_TROCA} figurinhas por lado.", HttpStatusCode.BadRequest);

        if (deUsuarioId == req.ParaUsuarioId)
            throw new RegraNegocioException("TROCA_INVALIDA", "Você não pode trocar com si mesmo.", HttpStatusCode.BadRequest);

        var troca = new MercadoTroca
        {
            DeUsuarioId = deUsuarioId,
            ParaUsuarioId = req.ParaUsuarioId,
            OfereceFigurinhasIds = req.OfereceIds,
            QuerFigurinhasIds = req.QuerIds,
            Status = StatusMercadoTroca.Pendente,
            CriadoEm = DateTime.UtcNow
        };

        db.MercadoTrocas.Add(troca);
        await db.SaveChangesAsync();
    }

    public async Task<List<TrocaResponse>> ListarPropostasAsync(long usuarioId)
    {
        return await db.MercadoTrocas
            .Include(t => t.DeUsuario)
            .Include(t => t.ParaUsuario)
            .Where(t => (t.DeUsuarioId == usuarioId || t.ParaUsuarioId == usuarioId) && t.Status == StatusMercadoTroca.Pendente)
            .Select(t => new TrocaResponse(
                t.Id, t.DeUsuarioId, t.DeUsuario!.Nome, t.ParaUsuarioId, t.ParaUsuario!.Nome, 
                t.OfereceFigurinhasIds, t.QuerFigurinhasIds, t.Status.ToString(), t.CriadoEm))
            .ToListAsync();
    }

    public async Task ResponderTrocaAsync(long usuarioLogadoId, long trocaId, string resposta)
    {
        var troca = await db.MercadoTrocas.FindAsync(trocaId)
            ?? throw new RegraNegocioException("TROCA_NAO_ENCONTRADA", "Proposta não encontrada.", HttpStatusCode.NotFound);

        if (troca.Status != StatusMercadoTroca.Pendente)
            throw new RegraNegocioException("TROCA_INATIVA", "Esta troca já foi concluída ou cancelada.", HttpStatusCode.BadRequest);

        if (resposta.Equals("cancelar", StringComparison.OrdinalIgnoreCase))
        {
            if (troca.DeUsuarioId != usuarioLogadoId && troca.ParaUsuarioId != usuarioLogadoId)
                throw new RegraNegocioException("NAO_AUTORIZADO", "Você não tem permissão para cancelar esta troca.", HttpStatusCode.Forbidden);

            troca.Status = StatusMercadoTroca.Cancelada;
            troca.RespondidoEm = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return;
        }

        if (resposta.Equals("aceitar", StringComparison.OrdinalIgnoreCase))
        {
            if (troca.ParaUsuarioId != usuarioLogadoId)
                throw new RegraNegocioException("NAO_AUTORIZADO", "Apenas o destinatário pode aceitar a troca.", HttpStatusCode.Forbidden);

            await using var transacao = await db.Database.BeginTransactionAsync();

            var primeiraFigId = troca.OfereceFigurinhasIds.First();
            var albumId = await db.Figurinhas.Where(f => f.Id == primeiraFigId).Select(f => f.AlbumId).FirstAsync();
            var album = await db.Albuns.FindAsync(albumId);
            
            // 🚀 FIX: A verificação correta de álbum legado
            bool isLegado = !album!.IsPrincipal;

            var ofereceReq = troca.OfereceFigurinhasIds.GroupBy(x => x).ToDictionary(g => g.Key, g => g.Count());
            var querReq = troca.QuerFigurinhasIds.GroupBy(x => x).ToDictionary(g => g.Key, g => g.Count());

            await ProcessarTransferencia(troca.DeUsuarioId, ofereceReq, querReq, album, isLegado, "Ofertante não possui mais as figurinhas ou elas foram bloqueadas.");
            await ProcessarTransferencia(troca.ParaUsuarioId, querReq, ofereceReq, album, isLegado, "Você não possui figurinhas suficientes ou elas estão protegidas.");

            troca.Status = StatusMercadoTroca.Concluida;
            troca.RespondidoEm = DateTime.UtcNow;
            await db.SaveChangesAsync();

            bool temTrocaAnterior = await db.MercadoTrocas.AnyAsync(t => 
                t.Status == StatusMercadoTroca.Concluida && t.Id != troca.Id &&
                ((t.DeUsuarioId == troca.DeUsuarioId && t.ParaUsuarioId == troca.ParaUsuarioId) || 
                 (t.DeUsuarioId == troca.ParaUsuarioId && t.ParaUsuarioId == troca.DeUsuarioId)));

            if (!temTrocaAnterior)
            {
                if (Random.Shared.NextDouble() < 0.008)
                {
                    await DarBonusParceriaAsync(troca.DeUsuarioId, albumId);
                    await DarBonusParceriaAsync(troca.ParaUsuarioId, albumId);
                }
            }

            await transacao.CommitAsync();
            return;
        }

        throw new RegraNegocioException("RESPOSTA_INVALIDA", "Resposta deve ser 'aceitar' ou 'cancelar'.", HttpStatusCode.BadRequest);
    }

    private async Task ProcessarTransferencia(long usuarioId, Dictionary<string, int> perde, Dictionary<string, int> ganha, Models.Album album, bool isLegado, string erroMsg)
    {
        var inventario = await db.UsuarioInventarios
            .Include(i => i.Figurinha) // 🚀 AQUI ESTÁ A CORREÇÃO: Evita o erro NullReferenceException!
            .Where(i => i.UsuarioId == usuarioId && i.Figurinha!.AlbumId == album.Id)
            .ToListAsync();

        int unicas = inventario.Count(i => i.Quantidade > 0 && !i.Figurinha!.IsSecreta && !i.Figurinha!.IsTrofeu);
        bool completouAlbum = unicas >= album.Total;

        foreach (var req in perde)
        {
            var item = inventario.FirstOrDefault(i => i.FigurinhaId == req.Key);
            int qtdAtual = item?.Quantidade ?? 0;
            
            int bloqueadas = (isLegado || completouAlbum) ? 1 : 0;
            int livre = qtdAtual - bloqueadas;

            if (livre < req.Value)
            {
                throw new RegraNegocioException("FALHA_NA_TROCA", erroMsg, HttpStatusCode.Conflict);
            }

            item!.Quantidade -= req.Value;
        }

        foreach (var req in ganha)
        {
            var item = inventario.FirstOrDefault(i => i.FigurinhaId == req.Key);
            if (item != null)
            {
                item.Quantidade += req.Value;
            }
            else
            {
                db.UsuarioInventarios.Add(new UsuarioInventario { UsuarioId = usuarioId, FigurinhaId = req.Key, Quantidade = req.Value });
            }
        }
    }

    // 🚀 NOVO: Busca o inventário do alvo formatado perfeitamente para o Frontend
    public async Task<List<object>> GetInventarioAlvoParaTrocaAsync(long albumId, long alvoUsuarioId)
    {
        var figurinhas = await db.UsuarioInventarios
            .Include(i => i.Figurinha) // Garante que a figurinha venha junto
            .Where(i => i.UsuarioId == alvoUsuarioId && i.Figurinha!.AlbumId == albumId && i.Quantidade > 0)
            .Select(i => (object)new
            {
                id = i.FigurinhaId,
                name = i.Figurinha!.Nome,
                image = i.Figurinha.ImagemUrl,
                quantity = i.Quantidade,
                rarityId = i.Figurinha.RaridadeId,
                isSecreta = i.Figurinha.IsSecreta,
                isTrofeu = i.Figurinha.IsTrofeu
            })
            .ToListAsync();

        return figurinhas;
    }

    private async Task DarBonusParceriaAsync(long usuarioId, long albumId)
    {
        var secreta = await db.Figurinhas.FirstOrDefaultAsync(f => f.AlbumId == albumId && f.Nome.Contains("Coringa"));
        if (secreta != null)
        {
            var inv = await db.UsuarioInventarios.FirstOrDefaultAsync(i => i.UsuarioId == usuarioId && i.FigurinhaId == secreta.Id);
            if (inv != null) inv.Quantidade += 1;
            else db.UsuarioInventarios.Add(new UsuarioInventario { UsuarioId = usuarioId, FigurinhaId = secreta.Id, Quantidade = 1 });
        }
    }
}