using System.Text.Json.Serialization;

namespace GamificacaoApi.Models;

/// <summary>
/// Espelha EXATAMENTE o JSON que a Fabrica de Albuns (front-end) gera pra
/// cada tipo de pacote. Os nomes dos campos (camelCase) sao de proposito
/// iguais ao payload do front - assim o JSON e guardado/devolvido igual ao
/// que foi enviado, sem tradução.
/// </summary>
public class RegrasDrop
{
    [JsonPropertyName("amount")]
    public int Amount { get; set; }

    [JsonPropertyName("behavior")]
    public string Behavior { get; set; } = "standard"; // "standard" | "pseudo" (pseudo ainda nao suportado na abertura)

    // chave = id da raridade (ex: "r_base"), valor = porcentagem (pode ter decimais)
    [JsonPropertyName("drops")]
    public Dictionary<string, decimal> Drops { get; set; } = new();

    // avaliado em CASCATA, na ordem do array - ver PacoteService (proximo passo)
    [JsonPropertyName("bonusTiers")]
    public List<BonusTier> BonusTiers { get; set; } = [];

    // JSON aninhado como string, nao interpretado ainda - liga ao modulo de Competicoes
    [JsonPropertyName("advancedRule")]
    public string? AdvancedRule { get; set; }
}

public class BonusTier
{
    [JsonPropertyName("chance")]
    public decimal Chance { get; set; }

    [JsonPropertyName("amount")]
    public int Amount { get; set; }
}
