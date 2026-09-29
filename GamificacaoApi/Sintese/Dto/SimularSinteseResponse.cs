using System.Text.Json.Serialization;

namespace GamificacaoApi.Sintese.Dto;

public record SimularSinteseResponse(
    [property: JsonPropertyName("successChance")] decimal SuccessChance,
    [property: JsonPropertyName("sameChance")] decimal SameChance,
    [property: JsonPropertyName("jumpChance")] decimal JumpChance,
    [property: JsonPropertyName("baseSuccessChance")] decimal BaseSuccessChance,
    [property: JsonPropertyName("catalystBonus")] decimal CatalystBonus,
    [property: JsonPropertyName("bonusCardChance")] decimal BonusCardChance,
    // 🚀 Novos campos para os nomes exatos das raridades
    [property: JsonPropertyName("targetRarityName")] string? TargetRarityName,
    [property: JsonPropertyName("sameRarityName")] string SameRarityName
);