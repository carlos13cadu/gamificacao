using System.Text.Json.Serialization;

namespace GamificacaoApi.Albuns.Dto;

public record AlbumResumoResponse(
    [property: JsonPropertyName("id")] long Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("desc")] string? Desc,
    [property: JsonPropertyName("total")] int? Total,
    [property: JsonPropertyName("isFinalized")] bool IsFinalized,
    [property: JsonPropertyName("isPrincipal")] bool IsPrincipal,
    [property: JsonPropertyName("permiteGameplay")] bool PermiteGameplay,
    [property: JsonPropertyName("subAlbumId")] long? SubAlbumId
);