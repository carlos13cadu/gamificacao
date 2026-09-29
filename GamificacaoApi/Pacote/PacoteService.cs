using System.Net;
using GamificacaoApi.Common;
using GamificacaoApi.Data;
using GamificacaoApi.Models;
using GamificacaoApi.Pacote.Dto;
using Microsoft.EntityFrameworkCore;

namespace GamificacaoApi.Pacote;

public class PacoteService(AppDbContext db)
{
    private readonly Random _random = new();

    public async Task<AbrirPacoteResponse> AbrirAsync(long usuarioId, string tipoPacoteId)
    {
        var tipoPacote = await db.TiposPacote.FirstOrDefaultAsync(t => t.Id == tipoPacoteId)
            ?? throw new RegraNegocioException("PACOTE_NAO_ENCONTRADO", "Tipo de pacote nao encontrado", HttpStatusCode.NotFound);

        var album = await db.Albuns.FirstOrDefaultAsync(a => a.Id == tipoPacote.AlbumId)
            ?? throw new RegraNegocioException("ALBUM_NAO_ENCONTRADO", "Album nao encontrado", HttpStatusCode.NotFound);

        if (!album.PermiteGameplay)
        {
            throw new RegraNegocioException(
                "ALBUM_NAO_PERMITE_GAMEPLAY",
                "Este album foi encerrado e nao permite mais progressao ou sintese.",
                HttpStatusCode.Forbidden);
        }

        if (tipoPacote.RegrasDrop.Behavior != "standard")
        {
            throw new RegraNegocioException(
                "COMPORTAMENTO_AINDA_NAO_SUPORTADO",
                $"O comportamento de pacote '{tipoPacote.RegrasDrop.Behavior}' ainda nao e suportado na abertura",
                HttpStatusCode.NotImplemented);
        }

        var usuarioPacote = await db.UsuarioPacotes
            .FirstOrDefaultAsync(p => p.UsuarioId == usuarioId && p.TipoPacoteId == tipoPacoteId);

        if (usuarioPacote is null || usuarioPacote.Quantidade <= 0)
        {
            throw new RegraNegocioException(
                "PACOTE_INDISPONIVEL", "Voce nao tem nenhum pacote desse tipo pra abrir", HttpStatusCode.Conflict);
        }

        var raridades = await db.Raridades.Where(r => r.AlbumId == album.Id).ToListAsync();
        if (raridades.Count == 0)
        {
            throw new RegraNegocioException(
                "ALBUM_SEM_RARIDADES", "Este album nao tem raridades configuradas", HttpStatusCode.InternalServerError);
        }

        var figurinhasDoAlbum = await db.Figurinhas.Where(f => f.AlbumId == album.Id).ToListAsync();

        int quantidadeTotal = CalcularQuantidadeComBonus(tipoPacote.RegrasDrop);
        var sorteadas = new List<FigurinhaSorteadaResponse>();

        // 🚀 DICIONÁRIO EM MEMÓRIA PARA ACUMULAR REPETIDAS DO MESMO PACOTE
        var contadorGanhos = new Dictionary<string, int>();

        for (int i = 0; i < quantidadeTotal; i++)
        {
            var raridadeSorteada = SortearRaridade(raridades, tipoPacote.RegrasDrop.Drops);

            var candidatas = figurinhasDoAlbum
                .Where(f => f.RaridadeId == raridadeSorteada.Id && !f.IsTrofeu)
                .ToList();

            if (candidatas.Count == 0)
            {
                throw new RegraNegocioException(
                    "RARIDADE_SEM_FIGURINHAS_ELEGIVEIS",
                    $"A raridade '{raridadeSorteada.Nome}' nao tem figurinhas elegiveis pra sorteio (todas sao trofeu, ou nenhuma cadastrada)",
                    HttpStatusCode.InternalServerError);
            }

            var figurinha = candidatas[_random.Next(candidatas.Count)];
            
            // Acumula na memória ao invés de bater no banco agora
            if (!contadorGanhos.ContainsKey(figurinha.Id))
                contadorGanhos[figurinha.Id] = 0;
            contadorGanhos[figurinha.Id]++;

            sorteadas.Add(new FigurinhaSorteadaResponse(
                figurinha.Id, figurinha.Nome, figurinha.ImagemUrl, raridadeSorteada.Id, raridadeSorteada.Nome));
        }

        // 🚀 AGORA SIM: Salva todas as figurinhas no banco, processando cada uma apenas UMA vez
        foreach (var ganho in contadorGanhos)
        {
            var figurinhaId = ganho.Key;
            var quantidadeMesa = ganho.Value;

            var inventario = await db.UsuarioInventarios
                .FirstOrDefaultAsync(i => i.UsuarioId == usuarioId && i.FigurinhaId == figurinhaId);

            if (inventario is null)
            {
                inventario = new UsuarioInventario { UsuarioId = usuarioId, FigurinhaId = figurinhaId, Quantidade = quantidadeMesa };
                db.UsuarioInventarios.Add(inventario);
            }
            else
            {
                inventario.Quantidade += quantidadeMesa;
            }
        }

        usuarioPacote.Quantidade -= 1;
        await db.SaveChangesAsync();

        return new AbrirPacoteResponse(sorteadas);
    }

    public async Task ConcederAsync(long usuarioId, string tipoPacoteId, int quantidade, string origem)
    {
        var tipoPacote = await db.TiposPacote.FirstOrDefaultAsync(t => t.Id == tipoPacoteId)
            ?? throw new RegraNegocioException("PACOTE_NAO_ENCONTRADO", "Tipo de pacote nao encontrado", HttpStatusCode.NotFound);

        var album = await db.Albuns.FirstOrDefaultAsync(a => a.Id == tipoPacote.AlbumId)
            ?? throw new RegraNegocioException("ALBUM_NAO_ENCONTRADO", "Album nao encontrado", HttpStatusCode.NotFound);

        if (!album.PermiteGameplay)
        {
            throw new RegraNegocioException(
                "ALBUM_NAO_PERMITE_GAMEPLAY",
                "Este album foi encerrado e nao permite mais progressao ou sintese.",
                HttpStatusCode.Forbidden);
        }

        var usuarioPacote = await db.UsuarioPacotes
            .FirstOrDefaultAsync(p => p.UsuarioId == usuarioId && p.TipoPacoteId == tipoPacoteId);

        if (usuarioPacote is null)
        {
            usuarioPacote = new UsuarioPacote { UsuarioId = usuarioId, TipoPacoteId = tipoPacoteId, Quantidade = 0 };
            db.UsuarioPacotes.Add(usuarioPacote);
        }

        usuarioPacote.Quantidade += quantidade;

        db.PacotesConcedidos.Add(new PacotesConcedidos
        {
            UsuarioId = usuarioId,
            TipoPacoteId = tipoPacoteId,
            Quantidade = quantidade,
            Origem = origem
        });

        await db.SaveChangesAsync();
    }

    private int CalcularQuantidadeComBonus(RegrasDrop regras)
    {
        int quantidade = regras.Amount;
        if (regras.BonusTiers.Count == 0) return quantidade;

        decimal sorteio = (decimal)_random.NextDouble() * 100m;
        decimal acumulado = 0;
        foreach (var tier in regras.BonusTiers)
        {
            acumulado += tier.Chance;
            if (sorteio <= acumulado)
            {
                quantidade += tier.Amount;
                break;
            }
        }

        return quantidade;
    }

    private Raridade SortearRaridade(List<Raridade> raridades, Dictionary<string, decimal> drops)
    {
        decimal total = drops.Values.Sum();
        if (total <= 0)
        {
            throw new RegraNegocioException(
                "CONFIGURACAO_SORTEIO_INVALIDA", "O pacote nao tem nenhum drop configurado", HttpStatusCode.InternalServerError);
        }

        decimal sorteio = (decimal)_random.NextDouble() * total;
        decimal acumulado = 0;

        foreach (var raridade in raridades)
        {
            if (!drops.TryGetValue(raridade.Id, out decimal peso) || peso <= 0) continue;
            acumulado += peso;
            if (sorteio < acumulado) return raridade;
        }

        return raridades.Last(r => drops.TryGetValue(r.Id, out decimal p) && p > 0);
    }
}