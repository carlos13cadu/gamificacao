using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace GamificacaoApi.Albuns.Dto;

// 1. DTO Auxiliar para extrair os bônus
public record PacoteBonusTierResponse(
    [property: JsonPropertyName("chance")] double Chance,
    [property: JsonPropertyName("amount")] int Amount
);

// 2. Classe para ler a coluna JSON (RegrasDrop) do banco de dados
public class RegrasDropDto
{
    [JsonPropertyName("amount")]
    public int Amount { get; set; }

    [JsonPropertyName("behavior")]
    public string Behavior { get; set; } = "standard";

    [JsonPropertyName("drops")]
    public Dictionary<string, double> Drops { get; set; } = new();

    [JsonPropertyName("bonusTiers")]
    public List<PacoteBonusTierResponse>? BonusTiers { get; set; }
}

// 3. O Response final (Plano, exatamente como o React espera)
public record PacoteResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("template")] string Template,
    [property: JsonPropertyName("amount")] int Amount,
    [property: JsonPropertyName("behavior")] string Behavior,
    [property: JsonPropertyName("drops")] Dictionary<string, double> Drops,
    [property: JsonPropertyName("bonusTiers")] List<PacoteBonusTierResponse>? BonusTiers
);