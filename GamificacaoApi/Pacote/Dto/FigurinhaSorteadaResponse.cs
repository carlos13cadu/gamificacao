using System.Text.Json.Serialization;

namespace GamificacaoApi.Pacote.Dto;

public record FigurinhaSorteadaResponse(
    [property: JsonPropertyName("stickerId")] string StickerId,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("image")] string? Image,
    [property: JsonPropertyName("rarityId")] string RarityId,
    [property: JsonPropertyName("rarityName")] string RarityName
);
