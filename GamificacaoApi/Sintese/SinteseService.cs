using System.Net;
using GamificacaoApi.Common;
using GamificacaoApi.Data;
using GamificacaoApi.Models;
using GamificacaoApi.Pacote.Dto;
using GamificacaoApi.Sintese.Dto;
using Microsoft.EntityFrameworkCore;

namespace GamificacaoApi.Sintese;

/// <summary>
/// Maquina de Sintese - versao generalizada da funcao "sintetizar" do
/// sistema legado (2 raridades fixas: comum/rara) pra N raridades definidas
/// por peso.
///
/// Faixas de peso (convencao combinada com o time):
///   peso < 100   -> raridade padrao (participa normal de tudo)
///   100-199      -> "secreta premiavel" (nunca input/catalisador, so pode
///                   sair como bonus raro)
///   peso >= 200  -> banida por completo (trofeu e afins)
///
/// Regras (ver conversa de design pra cada uma):
///   - Sempre 3 figurinhas base + catalisador opcional (4a).
///   - Cada uma exige 2+ copias (1a protegida).
///   - As 3 base nao podem ter diferenca de peso &gt; 2 entre si.
///   - Alvo = proxima raridade padrao acima da mais fraca das 3 (W).
///   - Contagem de quantas das 3 ja sao >= alvo -> tabela 5%/35%/68%/100%.
///   - "Salto": 1% por carta ja-no-alvo, checado ANTES do resto - se bater,
///     sai uma figurinha da faixa secreta (nao do alvo normal).
///   - Catalisador: peso igual ou 1 abaixo de W, nunca a raridade padrao
///     mais alta. Bonus cheio se peso==W, metade se peso==W-1.
///   - Caso especial "no teto" (as 3 base sao a raridade padrao mais alta):
///     nao ha alvo padrao acima - so existe a chance de salto (secreta) ou
///     o resultado garantido na propria raridade-teto.
///   - Com catalisador E contagem=3 (ou no teto), desbloqueia uma 2a carta
///     bonus (42% de chance, 15% dela ser secreta).
///   - Nunca sai nada abaixo da raridade da figurinha mais fraca usada.
/// </summary>
public class SinteseService(AppDbContext db)
{
    private readonly Random _random = new();

    private const int LimiteSecretaMin = 100;
    private const int LimiteSecretaMax = 200; // exclusivo
    private const int EspalhamentoMaximo = 2;

    private static readonly Dictionary<int, decimal> TabelaChanceBase = new()
    {
        { 0, 0.05m }, { 1, 0.35m }, { 2, 0.68m }, { 3, 1.00m }
    };

    public async Task<SimularSinteseResponse> SimularAsync(long usuarioId, SinteseRequest request)
    {
        var ctx = await ValidarEContextualizarAsync(usuarioId, request);
        var (chanceSucesso, chanceSalto, baseSucesso, bonusCat) = CalcularChances(ctx);
        
        decimal chanceMesma = 1m - chanceSucesso - chanceSalto;
        decimal chanceBonusCard = ctx.DesbloqueiaCartaBonus ? 0.42m : 0m;

        return new SimularSinteseResponse(
            chanceSucesso, 
            chanceMesma, 
            chanceSalto, 
            baseSucesso, 
            bonusCat, 
            chanceBonusCard,
            ctx.TargetRaridade?.Nome, // Nome da evolução (Ex: "Rara")
            ctx.WRaridade.Nome        // Nome da base (Ex: "Comum")
        );
    }

    public async Task<ExecutarSinteseResponse> ExecutarAsync(long usuarioId, SinteseRequest request)
    {
        var ctx = await ValidarEContextualizarAsync(usuarioId, request);
        var (chanceSucesso, chanceSalto, _, _) = CalcularChances(ctx);

        await using var transacao = await db.Database.BeginTransactionAsync();

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

        if (ctx.DesbloqueiaCartaBonus && (decimal)_random.NextDouble() < 0.42m)
        {
            bool bonusSecreta = (decimal)_random.NextDouble() < 0.15m;
            var cartaBonus = bonusSecreta
                ? await SortearDaFaixaAsync(ctx.AlbumId, LimiteSecretaMin, LimiteSecretaMax)
                : await SortearDaRaridadeAsync(ctx.NoTeto ? ctx.WRaridade.Id : ctx.TargetRaridade!.Id);
            resultados.Add(cartaBonus);
        }

        foreach (var card in ctx.BaseCards) await ConsumirCopiaAsync(usuarioId, card.Id);
        if (ctx.Catalyst is not null) await ConsumirCopiaAsync(usuarioId, ctx.Catalyst.Id);
        foreach (var fig in resultados) await CreditarInventarioAsync(usuarioId, fig.Id);

        await db.SaveChangesAsync();
        await transacao.CommitAsync();

        return new ExecutarSinteseResponse(
            status,
            resultados.Select(f => new FigurinhaSorteadaResponse(
                f.Id, f.Nome, f.ImagemUrl, f.RaridadeId, f.Raridade?.Nome ?? "")).ToList());
    }

    private (decimal chanceSucesso, decimal chanceSalto, decimal baseSucesso, decimal bonusCat) CalcularChances(ContextoSintese ctx)
    {
        decimal chanceSalto = ctx.QtdSuperior * 0.01m;

        if (ctx.NoTeto)
        {
            return (0m, chanceSalto, 0m, 0m);
        }

        decimal baseSucesso = TabelaChanceBase[ctx.QtdSuperior];
        decimal bonusCat = 0m;

        if (ctx.Catalyst is not null && ctx.QtdSuperior < 3)
        {
            decimal bonusCheio = ctx.QtdSuperior switch { 0 => 0.06m, 1 => 0.09m, 2 => 0.12m, _ => 0m };
            bonusCat = ctx.CatalystPeso == ctx.WRaridade.Peso ? bonusCheio : bonusCheio / 2m;
        }

        decimal chanceSucesso = Math.Min(1.00m, baseSucesso + bonusCat);

        return (chanceSucesso, chanceSalto, baseSucesso, bonusCat);
    }

    private async Task<ContextoSintese> ValidarEContextualizarAsync(long usuarioId, SinteseRequest request)
    {
        if (request.StickerIds.Count != 3)
        {
            throw new RegraNegocioException(
                "SINTESE_REQUER_3_FIGURINHAS", "A sintese exige exatamente 3 figurinhas base", HttpStatusCode.BadRequest);
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

        foreach (var fig in baseCards)
        {
            if (fig.IsTrofeu || fig.Raridade!.Peso >= LimiteSecretaMin)
            {
                throw new RegraNegocioException(
                    "FIGURINHA_NAO_ELEGIVEL_PARA_SINTESE",
                    $"A figurinha '{fig.Nome}' nao pode ser usada na sintese (e secreta ou trofeu)",
                    HttpStatusCode.BadRequest);
            }

            await ExigirDuasCopiasAsync(usuarioId, fig);
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
            ? baseCards.Count(f => f.Raridade!.Peso == maxStandardPeso) // sempre 3 neste ramo
            : baseCards.Count(f => f.Raridade!.Peso >= targetRaridade!.Peso);

        Figurinha? catalyst = null;
        int? catalystPeso = null;

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

            await ExigirDuasCopiasAsync(usuarioId, catalyst);
            catalystPeso = pesoCatalisador;
        }

        bool desbloqueiaCartaBonus = catalyst is not null && (noTeto || qtdSuperior == 3);

        return new ContextoSintese
        {
            AlbumId = albumId,
            BaseCards = baseCards,
            Catalyst = catalyst,
            WRaridade = wRaridade,
            TargetRaridade = targetRaridade,
            QtdSuperior = qtdSuperior,
            NoTeto = noTeto,
            DesbloqueiaCartaBonus = desbloqueiaCartaBonus,
            CatalystPeso = catalystPeso
        };
    }

    private async Task ExigirDuasCopiasAsync(long usuarioId, Figurinha fig)
    {
        int quantidade = await db.UsuarioInventarios
            .Where(i => i.UsuarioId == usuarioId && i.FigurinhaId == fig.Id)
            .Select(i => (int?)i.Quantidade).FirstOrDefaultAsync() ?? 0;

        if (quantidade < 2)
        {
            throw new RegraNegocioException(
                "COPIAS_INSUFICIENTES",
                $"Voce precisa de pelo menos 2 copias de '{fig.Nome}' (a 1a copia fica protegida)",
                HttpStatusCode.BadRequest);
        }
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
                "RARIDADE_SEM_FIGURINHAS_ELEGIVEIS", "Nao ha figurinhas elegiveis nessa raridade pra sair da sintese", HttpStatusCode.InternalServerError);
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

    private class ContextoSintese
    {
        public required long AlbumId { get; init; }
        public required List<Figurinha> BaseCards { get; init; }
        public required Figurinha? Catalyst { get; init; }
        public required Raridade WRaridade { get; init; }
        public required Raridade? TargetRaridade { get; init; }
        public required int QtdSuperior { get; init; }
        public required bool NoTeto { get; init; }
        public required bool DesbloqueiaCartaBonus { get; init; }
        public required int? CatalystPeso { get; init; }
    }
}
