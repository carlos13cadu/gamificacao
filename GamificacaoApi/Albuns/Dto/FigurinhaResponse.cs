using System.Text.Json.Serialization;

namespace GamificacaoApi.Albuns.Dto;

public record FigurinhaResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("rarityId")] string RarityId,
    [property: JsonPropertyName("image")] string? Image,
    [property: JsonPropertyName("isSecret")] bool IsSecret,
    [property: JsonPropertyName("isTrophy")] bool IsTrophy,
    [property: JsonPropertyName("passiveDesc")] string? PassiveDesc,
    [property: JsonPropertyName("passiveRule")] string? PassiveRule
);
