using System.Text.Json.Serialization;

namespace GamificacaoApi.Forja.Dto;

public record SimularForjaResponse(
    [property: JsonPropertyName("explosionChance")] decimal ExplosionChance,
    [property: JsonPropertyName("successChance")] decimal SuccessChance,
    [property: JsonPropertyName("sameChance")] decimal SameChance,
    [property: JsonPropertyName("jumpChance")] decimal JumpChance,
    [property: JsonPropertyName("baseSuccess")] decimal BaseSuccess,   // valor da tabela, antes do bonus fixo de +50%
    [property: JsonPropertyName("forgeBonus")] decimal ForgeBonus,     // o bonus fixo (0.50, ou 0 se "no teto")
    [property: JsonPropertyName("bonusCardChance")] decimal BonusCardChance, // chance de receber a carta bonus (= sobrevive a explosao)
    [property: JsonPropertyName("targetRarityName")] string? TargetRarityName, // Nome da evolucao (Ex: "Rara") - null se "no teto"
    [property: JsonPropertyName("baseRarityName")] string BaseRarityName       // Nome da base (Ex: "Comum")
);