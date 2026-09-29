using System.Net;
using GamificacaoApi.Common;
using GamificacaoApi.Data;
using GamificacaoApi.Forja.Dto;
using GamificacaoApi.Models;
using GamificacaoApi.Pacote.Dto;
using Microsoft.EntityFrameworkCore;

namespace GamificacaoApi.Forja;

/// <summary>
/// Forja - a variante arriscada da Maquina de Sintese, restrita a
/// figurinhas de um "album legado" (um album referenciado como SubAlbumId
/// de outro album). Usa a mesma base de calculo da Sintese (tabela de
/// chance por contagem, faixas de peso, "nunca abaixo da mais fraca").
///
/// O catalisador ("slot de risco") e OPCIONAL:
///   - SEM catalisador: funciona como uma sintese comum dentro do album
///     legado - sem explosao, sem bonus de +50%, sem carta bonus garantida.
///     So a tabela padrao (5%/35%/68%/100%) + a chance de salto.
///   - COM catalisador: e o que ativa o modo arriscado -
///       1. 35% de chance de EXPLOSAO: perde todas as figurinhas usadas
///          (bases + catalisador) e nao recebe nada. Checado antes de tudo.
///       2. Se sobreviver (65%): +50% de chance de sucesso (em vez do bonus
///          pequeno da Sintese normal), e SEMPRE sai uma 2a carta bonus
///          (garantida, nao e uma chance).
///
/// Elegibilidade de figurinha, "no teto", catalisador (peso W ou W-1, nunca
/// o teto), a validacao de copias (soma quantas vezes cada figurinha e
/// usada, nao checa isolado) e o "nunca abaixo" seguem as mesmas regras da
/// Sintese.
/// </summary>
public class ForjaService(AppDbContext db)
{
    private readonly Random _random = new();

    private const int LimiteSecretaMin = 100;
    private const int LimiteSecretaMax = 200;
    private const int EspalhamentoMaximo = 2;
    private const decimal ChanceExplosao = 0.35m;

    private static readonly Dictionary<int, decimal> TabelaChanceBase = new()
    {
        { 0, 0.05m }, { 1, 0.35m }, { 2, 0.68m }, { 3, 1.00m }
    };

    public async Task<SimularForjaResponse> SimularAsync(long usuarioId, ForjaRequest request)
    {
        var ctx = await ValidarEContextualizarAsync(usuarioId, request);
        var (chanceSucessoCondicional, chanceSaltoCondicional, baseSucesso, forgeBonus) = CalcularChances(ctx);

        // Sem catalisador nao ha risco de explosao nenhum.
        decimal chanceExplosao = ctx.Catalyst is not null ? ChanceExplosao : 0m;
        decimal sobrevivencia = 1m - chanceExplosao;

        // Decomposicao correta (sorteios sequenciais: primeiro salto, so se
        // nao bater rola sucesso) - nao e so "sobra" de uma subtracao simples.
        decimal chanceSaltoAbsoluta = sobrevivencia * chanceSaltoCondicional;
        decimal chanceSucessoAbsoluta = sobrevivencia * (1m - chanceSaltoCondicional) * chanceSucessoCondicional;
        decimal chanceMesmaAbsoluta = sobrevivencia - chanceSaltoAbsoluta - chanceSucessoAbsoluta;

        // Carta bonus garantida so existe no modo arriscado (com catalisador).
        decimal bonusCardChance = ctx.Catalyst is not null ? sobrevivencia : 0m;

        return new SimularForjaResponse(
            chanceExplosao,
            chanceSucessoAbsoluta,
            Math.Max(0, chanceMesmaAbsoluta),
            chanceSaltoAbsoluta,
            baseSucesso,
            forgeBonus,
            bonusCardChance,
            ctx.TargetRaridade?.Nome,
            ctx.WRaridade.Nome
        );
    }

    public async Task<ExecutarForjaResponse> ExecutarAsync(long usuarioId, ForjaRequest request)
    {
        var ctx = await ValidarEContextualizarAsync(usuarioId, request);
        var (chanceSucesso, chanceSalto, _, _) = CalcularChances(ctx);

        await using var transacao = await db.Database.BeginTransactionAsync();

        // consome tudo primeiro - se explodir, ja gastou mesmo assim
        foreach (var card in ctx.BaseCards) await ConsumirCopiaAsync(usuarioId, card.Id);
        if (ctx.Catalyst is not null) await ConsumirCopiaAsync(usuarioId, ctx.Catalyst.Id);

        // Risco de explosao SO existe com catalisador presente.
        if (ctx.Catalyst is not null && (decimal)_random.NextDouble() < ChanceExplosao)
        {
            await db.SaveChangesAsync();
            await transacao.CommitAsync();
            return new ExecutarForjaResponse("explosion", []);
        }

        Figurinha resultadoPrincipal;
        string status;

        if ((decimal)_random.NextDouble() < chanceSalto)
        {
            resultadoPrincipal = await SortearDaFaixaAsync(ctx.AlbumId, LimiteSecretaMin, LimiteSecretaMax);
            status = "jump";
        }
        else if (ctx.NoTeto)
        {
            resultadoPrincipal = await SortearDaRaridadeAsync(ctx.WRaridade.Id);
            status = "same";
        }
        else if ((decimal)_random.NextDouble() < chanceSucesso)
        {
            resultadoPrincipal = await SortearDaRaridadeAsync(ctx.TargetRaridade!.Id);
            status = "upgrade";
        }
        else
        {
            resultadoPrincipal = await SortearDaRaridadeAsync(ctx.WRaridade.Id);
            status = "same";
        }

        var resultados = new List<Figurinha> { resultadoPrincipal };

        // Carta bonus GARANTIDA - so existe quando o slot de risco (catalisador) foi usado.
        if (ctx.Catalyst is not null)
        {
            decimal chanceBonusMelhor = Math.Min(1.00m, 0.20m + ctx.QtdSuperior * 0.20m);
            bool bonusMelhor = (decimal)_random.NextDouble() < chanceBonusMelhor;
            var raridadeBonus = bonusMelhor
                ? (ctx.NoTeto ? ctx.WRaridade.Id : ctx.TargetRaridade!.Id)
                : ctx.WRaridade.Id;
            resultados.Add(await SortearDaRaridadeAsync(raridadeBonus));
        }

        foreach (var fig in resultados) await CreditarInventarioAsync(usuarioId, fig.Id);

        await db.SaveChangesAsync();
        await transacao.CommitAsync();

        return new ExecutarForjaResponse(
            status,
            resultados.Select(f => new FigurinhaSorteadaResponse(
                f.Id, f.Nome, f.ImagemUrl, f.RaridadeId, f.Raridade?.Nome ?? "")).ToList());
    }

    private (decimal chanceSucesso, decimal chanceSalto, decimal baseSucesso, decimal forgeBonus) CalcularChances(ContextoForja ctx)
    {
        decimal chanceSalto = ctx.QtdSuperior * 0.01m;

        if (ctx.NoTeto)
        {
            return (0m, chanceSalto, 0m, 0m);
        }

        decimal baseSucesso = TabelaChanceBase[ctx.QtdSuperior];

        // O bonus fixo de +50% SO existe com o slot de risco (catalisador).
        // Sem ele, e a mesma tabela padrao da Sintese sem catalisador.
        decimal forgeBonus = ctx.Catalyst is not null ? 0.50m : 0m;
        decimal chanceSucesso = Math.Min(1.00m, baseSucesso + forgeBonus);

        return (chanceSucesso, chanceSalto, baseSucesso, forgeBonus);
    }

    private async Task<ContextoForja> ValidarEContextualizarAsync(long usuarioId, ForjaRequest request)
    {
        if (request.StickerIds.Count != 3)
        {
            throw new RegraNegocioException(
                "FORJA_REQUER_3_FIGURINHAS", "A forja exige exatamente 3 figurinhas base", HttpStatusCode.BadRequest);
        }

        var baseCards = new List<Figurinha>();
        foreach (var id in request.StickerIds)
        {
            var fig = await db.Figurinhas.Include(f => f.Raridade).FirstOrDefaultAsync(f => f.Id == id)
                ?? throw new RegraNegocioException("FIGURINHA_NAO_ENCONTRADA", $"Figurinha '{id}' nao encontrada", HttpStatusCode.NotFound);
            baseCards.Add(fig);
        }

        long albumId = baseCards[0].AlbumId;
        if (baseCards.Any(f => f.AlbumId != albumId))
        {
            throw new RegraNegocioException(
                "FIGURINHAS_DE_ALBUNS_DIFERENTES", "As figurinhas precisam ser do mesmo album", HttpStatusCode.BadRequest);
        }

        var album = await db.Albuns.FirstOrDefaultAsync(a => a.Id == albumId)
            ?? throw new RegraNegocioException("ALBUM_NAO_ENCONTRADO", "Album nao encontrado", HttpStatusCode.NotFound);
        if (!album.PermiteGameplay)
        {
            throw new RegraNegocioException(
                "ALBUM_NAO_PERMITE_GAMEPLAY",
                "Este album foi encerrado e nao permite mais progressao ou sintese.",
                HttpStatusCode.Forbidden);
        }

        // Forja so vale pra album legado - precisa ser o SubAlbumId de algum outro album
        bool ehAlbumLegado = await db.Albuns.AnyAsync(a => a.SubAlbumId == albumId);
        if (!ehAlbumLegado)
        {
            throw new RegraNegocioException(
                "FORJA_SO_PERMITIDA_EM_ALBUM_LEGADO",
                "A Forja so pode ser usada com figurinhas de um album legado (sub-album)",
                HttpStatusCode.BadRequest);
        }

        foreach (var fig in baseCards)
        {
            if (fig.IsTrofeu || fig.Raridade!.Peso >= LimiteSecretaMin)
            {
                throw new RegraNegocioException(
                    "FIGURINHA_NAO_ELEGIVEL_PARA_FORJA",
                    $"A figurinha '{fig.Nome}' nao pode ser usada na forja (e secreta ou trofeu)",
                    HttpStatusCode.BadRequest);
            }
        }

        int pesoMin = baseCards.Min(f => f.Raridade!.Peso);
        int pesoMax = baseCards.Max(f => f.Raridade!.Peso);
        if (pesoMax - pesoMin > EspalhamentoMaximo)
        {
            throw new RegraNegocioException(
                "FIGURINHAS_MUITO_ESPALHADAS",
                $"A diferenca de raridade entre as 3 figurinhas base nao pode passar de {EspalhamentoMaximo} niveis",
                HttpStatusCode.BadRequest);
        }

        var wRaridade = baseCards.First(f => f.Raridade!.Peso == pesoMin).Raridade!;

        var raridadesPadrao = await db.Raridades
            .Where(r => r.AlbumId == albumId && r.Peso < LimiteSecretaMin)
            .OrderBy(r => r.Peso)
            .ToListAsync();

        if (raridadesPadrao.Count == 0)
        {
            throw new RegraNegocioException(
                "ALBUM_SEM_RARIDADES_PADRAO", "Este album nao tem raridades padrao configuradas", HttpStatusCode.InternalServerError);
        }

        int maxStandardPeso = raridadesPadrao.Max(r => r.Peso);
        bool noTeto = pesoMin == maxStandardPeso;

        Raridade? targetRaridade = noTeto ? null : raridadesPadrao.First(r => r.Peso > pesoMin);
        int qtdSuperior = noTeto
            ? baseCards.Count(f => f.Raridade!.Peso == maxStandardPeso)
            : baseCards.Count(f => f.Raridade!.Peso >= targetRaridade!.Peso);

        // Catalisador (slot de risco) e OPCIONAL - so resolve/valida se foi enviado.
        Figurinha? catalyst = null;
        if (request.CatalystId is not null)
        {
            catalyst = await db.Figurinhas.Include(f => f.Raridade).FirstOrDefaultAsync(f => f.Id == request.CatalystId)
                ?? throw new RegraNegocioException("FIGURINHA_NAO_ENCONTRADA", "Catalisador nao encontrado", HttpStatusCode.NotFound);

            if (catalyst.AlbumId != albumId)
            {
                throw new RegraNegocioException(
                    "FIGURINHAS_DE_ALBUNS_DIFERENTES", "O catalisador precisa ser do mesmo album", HttpStatusCode.BadRequest);
            }

            int pesoCatalisador = catalyst.Raridade!.Peso;
            bool dentroDaFaixa = pesoCatalisador == pesoMin || pesoCatalisador == pesoMin - 1;
            bool ehRaridadeTeto = pesoCatalisador == maxStandardPeso;

            if (catalyst.IsTrofeu || pesoCatalisador >= LimiteSecretaMin || !dentroDaFaixa || ehRaridadeTeto)
            {
                throw new RegraNegocioException(
                    "CATALISADOR_INVALIDO",
                    "O catalisador precisa ser da mesma raridade da figurinha mais fraca (ou 1 nivel abaixo), e nunca pode ser a raridade padrao mais alta",
                    HttpStatusCode.BadRequest);
            }
        }

        // Conta quantas vezes cada figurinha (bases + catalisador, se houver)
        // e usada nesta forja - repeticao entre as 3 bases e permitida.
        var usos = new Dictionary<string, int>();
        foreach (var fig in baseCards) usos[fig.Id] = usos.GetValueOrDefault(fig.Id) + 1;
        if (catalyst is not null) usos[catalyst.Id] = usos.GetValueOrDefault(catalyst.Id) + 1;

        foreach (var (figurinhaId, vezesUsada) in usos)
        {
            int quantidadePossuida = await db.UsuarioInventarios
                .Where(i => i.UsuarioId == usuarioId && i.FigurinhaId == figurinhaId)
                .Select(i => (int?)i.Quantidade).FirstOrDefaultAsync() ?? 0;

            if (quantidadePossuida < vezesUsada + 1)
            {
                var nomeFigurinha = baseCards.Concat(catalyst is not null ? [catalyst] : [])
                    .First(f => f.Id == figurinhaId).Nome;
                throw new RegraNegocioException(
                    "COPIAS_INSUFICIENTES",
                    $"Voce precisa de pelo menos {vezesUsada + 1} copias de '{nomeFigurinha}' pra usa-la {vezesUsada}x nesta forja (a 1a copia fica protegida)",
                    HttpStatusCode.BadRequest);
            }
        }

        return new ContextoForja
        {
            AlbumId = albumId,
            BaseCards = baseCards,
            Catalyst = catalyst,
            WRaridade = wRaridade,
            TargetRaridade = targetRaridade,
            QtdSuperior = qtdSuperior,
            NoTeto = noTeto
        };
    }

    private async Task<Figurinha> SortearDaRaridadeAsync(string raridadeId)
    {
        var candidatas = await db.Figurinhas
            .Include(f => f.Raridade)
            .Where(f => f.RaridadeId == raridadeId && !f.IsTrofeu)
            .ToListAsync();

        if (candidatas.Count == 0)
        {
            throw new RegraNegocioException(
                "RARIDADE_SEM_FIGURINHAS_ELEGIVEIS", "Nao ha figurinhas elegiveis nessa raridade pra sair da forja", HttpStatusCode.InternalServerError);
        }

        return candidatas[_random.Next(candidatas.Count)];
    }

    private async Task<Figurinha> SortearDaFaixaAsync(long albumId, int pesoMinInclusive, int pesoMaxExclusive)
    {
        var candidatas = await db.Figurinhas
            .Include(f => f.Raridade)
            .Where(f => f.AlbumId == albumId && !f.IsTrofeu &&
                        f.Raridade!.Peso >= pesoMinInclusive && f.Raridade.Peso < pesoMaxExclusive)
            .ToListAsync();

        if (candidatas.Count == 0)
        {
            throw new RegraNegocioException(
                "FAIXA_SECRETA_VAZIA", "Este album nao tem nenhuma figurinha secreta cadastrada pra premiar", HttpStatusCode.InternalServerError);
        }

        return candidatas[_random.Next(candidatas.Count)];
    }

    private async Task ConsumirCopiaAsync(long usuarioId, string figurinhaId)
    {
        var inventario = await db.UsuarioInventarios
            .FirstOrDefaultAsync(i => i.UsuarioId == usuarioId && i.FigurinhaId == figurinhaId);

        if (inventario is null || inventario.Quantidade < 2)
        {
            throw new RegraNegocioException(
                "COPIAS_INSUFICIENTES", "O inventario mudou entre a validacao e a execucao - tenta de novo", HttpStatusCode.Conflict);
        }

        inventario.Quantidade -= 1;
    }

    private async Task CreditarInventarioAsync(long usuarioId, string figurinhaId)
    {
        var inventario = await db.UsuarioInventarios
            .FirstOrDefaultAsync(i => i.UsuarioId == usuarioId && i.FigurinhaId == figurinhaId);

        if (inventario is null)
        {
            inventario = new UsuarioInventario { UsuarioId = usuarioId, FigurinhaId = figurinhaId, Quantidade = 0 };
            db.UsuarioInventarios.Add(inventario);
        }

        inventario.Quantidade += 1;
    }

    private class ContextoForja
    {
        public required long AlbumId { get; init; }
        public required List<Figurinha> BaseCards { get; init; }
        public required Figurinha? Catalyst { get; init; }
        public required Raridade WRaridade { get; init; }
        public required Raridade? TargetRaridade { get; init; }
        public required int QtdSuperior { get; init; }
        public required bool NoTeto { get; init; }
    }
}