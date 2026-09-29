using System.Net;
using GamificacaoApi.Albuns.Dto;
using GamificacaoApi.Common;
using GamificacaoApi.Data;
using Microsoft.EntityFrameworkCore;

namespace GamificacaoApi.Albuns;

public class AlbumService(AppDbContext db)
{
    public async Task<List<AlbumResumoResponse>> ListarAlbunsAsync(long usuarioId)
    {
        return await db.Albuns
            .Where(a => 
                // Regra 1: O álbum NÃO está finalizado (é público, todos veem)
                !a.IsFinalized || 
                
                // Regra 2: Está finalizado, mas o usuário TEM pelo menos 1 figurinha dele (Quantidade > 0)
                db.UsuarioInventarios.Any(i => 
                    i.UsuarioId == usuarioId && 
                    i.Quantidade > 0 &&
                    db.Figurinhas.Any(f => f.Id == i.FigurinhaId && f.AlbumId == a.Id)
                ) ||
                
                // Regra 3: Está finalizado, mas o usuário TEM pacotinhos fechados guardados
                db.UsuarioPacotes.Any(p => 
                    p.UsuarioId == usuarioId && 
                    p.Quantidade > 0 &&
                    db.TiposPacote.Any(tp => tp.Id == p.TipoPacoteId && tp.AlbumId == a.Id)
                )
            )
            .Select(a => new AlbumResumoResponse(
                a.Id, a.Nome, a.Descricao, a.Total, a.IsFinalized, a.IsPrincipal, a.PermiteGameplay, a.SubAlbumId))
            .ToListAsync();
    }

    public async Task<List<AlbumResumoResponse>> ListarTodosAlbunsAdminAsync()
    {
        return await db.Albuns
            .Select(a => new AlbumResumoResponse(
                a.Id, a.Nome, a.Descricao, a.Total, a.IsFinalized, a.IsPrincipal, a.PermiteGameplay, a.SubAlbumId))
            .ToListAsync();
    }

    public async Task<AlbumDetalheResponse> GetCatalogoAsync(long albumId)
    {
        var album = await db.Albuns.FirstOrDefaultAsync(a => a.Id == albumId)
            ?? throw new RegraNegocioException("ALBUM_NAO_ENCONTRADO", "Album nao encontrado", HttpStatusCode.NotFound);

        return await MontarDetalheAsync(album, permitirSubAlbum: true);
    }

    public async Task<AlbumDetalheResponse> GetPrincipalAsync()
    {
        var album = await db.Albuns.FirstOrDefaultAsync(a => a.IsPrincipal)
            ?? throw new RegraNegocioException(
                "NENHUM_ALBUM_PRINCIPAL", "Nenhum album esta marcado como principal no momento", HttpStatusCode.NotFound);

        return await MontarDetalheAsync(album, permitirSubAlbum: true);
    }

    // permitirSubAlbum evita recursao infinita - so aninha 1 nivel (o "album legado"),
    // nunca o sub-album do sub-album.
    private async Task<AlbumDetalheResponse> MontarDetalheAsync(Models.Album album, bool permitirSubAlbum)
    {
        var raridades = await db.Raridades
            .Where(r => r.AlbumId == album.Id)
            .OrderBy(r => r.Ordem)
            .Select(r => new RaridadeResponse(r.Id, r.Nome, r.CorHex, r.Peso, r.Ordem))
            .ToListAsync();

        var figurinhas = await db.Figurinhas
            .Where(f => f.AlbumId == album.Id)
            .Select(f => new FigurinhaResponse(
                f.Id, f.Nome, f.RaridadeId, f.ImagemUrl, f.IsSecreta, f.IsTrofeu, f.PassivaDesc, f.Passiva))
            .ToListAsync();

        var pacotesEntities = await db.TiposPacote
    .Where(p => p.AlbumId == album.Id)
    .ToListAsync();

        // 2. Mapeia diretamente usando a classe RegrasDrop que já existe no seu projeto
        var pacotes = pacotesEntities.Select(p => 
        {
            // Como p.RegrasDrop já é um objeto do tipo RegrasDrop (ou nulo), 
            // apenas lemos suas propriedades de forma segura.
            var regras = p.RegrasDrop ?? new GamificacaoApi.Models.RegrasDrop();

            // Convertemos o dicionário de decimal para double se o seu PacoteResponse esperar double, 
            // ou mantemos decimal se ajustar lá. Aqui convertemos para double com segurança:
            var dropsDouble = regras.Drops?.ToDictionary(k => k.Key, v => (double)v.Value) ?? new Dictionary<string, double>();

            var bonusTiersResponse = regras.BonusTiers?.Select(b => new PacoteBonusTierResponse(
                (double)b.Chance, 
                b.Amount
            )).ToList();

            return new PacoteResponse(
                p.Id, 
                p.Nome, 
                p.Template,
                regras.Amount > 0 ? regras.Amount : 1, 
                string.IsNullOrEmpty(regras.Behavior) ? "standard" : regras.Behavior, 
                dropsDouble, 
                bonusTiersResponse
            );
        }).ToList();

        AlbumDetalheResponse? subAlbum = null;
        if (permitirSubAlbum && album.SubAlbumId is not null)
        {
            var subAlbumEntity = await db.Albuns.FirstOrDefaultAsync(a => a.Id == album.SubAlbumId);
            if (subAlbumEntity is not null)
            {
                subAlbum = await MontarDetalheAsync(subAlbumEntity, permitirSubAlbum: false);
            }
        }

        return new AlbumDetalheResponse(
            album.Id, album.Nome, album.Descricao, album.Total,
            album.IsFinalized, album.IsPrincipal, album.PermiteGameplay, album.SubAlbumId,
            raridades, figurinhas, pacotes, subAlbum
        );
    }

    public async Task<string> ResgatarTrofeuAsync(long albumId, long usuarioId)
    {
        // 1. Encontra o Troféu do álbum solicitado
        var trofeu = await db.Figurinhas
            .FirstOrDefaultAsync(f => f.AlbumId == albumId && f.IsTrofeu);

        if (trofeu == null)
            return "Este álbum não possui troféu configurado.";

        // 2. Verifica se o usuário já tem o troféu
        var inventarioTrofeu = await db.UsuarioInventarios
            .FirstOrDefaultAsync(i => i.UsuarioId == usuarioId && i.FigurinhaId == trofeu.Id);

        if (inventarioTrofeu != null && inventarioTrofeu.Quantidade > 0)
            return "Troféu já resgatado!";

        // 3. Adiciona o troféu ao inventário do usuário
        if (inventarioTrofeu == null)
        {
            inventarioTrofeu = new Models.UsuarioInventario 
            { 
                UsuarioId = usuarioId, 
                FigurinhaId = trofeu.Id, 
                Quantidade = 1 
            };
            db.UsuarioInventarios.Add(inventarioTrofeu);
        }
        else
        {
            inventarioTrofeu.Quantidade += 1;
        }

        await db.SaveChangesAsync();

        return "Troféu resgatado com sucesso!";
    }

    public async Task<InventarioResponse> GetInventarioAsync(long albumId, long usuarioId)
    {
        bool albumExiste = await db.Albuns.AnyAsync(a => a.Id == albumId);
        if (!albumExiste)
        {
            throw new RegraNegocioException("ALBUM_NAO_ENCONTRADO", "Album nao encontrado", HttpStatusCode.NotFound);
        }

        var figurinhas = await db.UsuarioInventarios
            .Where(i => i.UsuarioId == usuarioId && i.Figurinha!.AlbumId == albumId)
            .Select(i => new FigurinhaComQuantidade(i.FigurinhaId, i.Quantidade))
            .ToListAsync();

        var pacotes = await db.UsuarioPacotes
            .Where(p => p.UsuarioId == usuarioId && p.TipoPacote!.AlbumId == albumId && p.Quantidade > 0)
            .Select(p => new PacoteComQuantidade(p.TipoPacoteId, p.TipoPacote!.Nome, p.Quantidade))
            .ToListAsync();

        return new InventarioResponse(figurinhas, pacotes);
    }
}
