using System.Text.Json.Serialization;

namespace GamificacaoApi.Albuns.Dto;

public record AlbumDetalheResponse(
    [property: JsonPropertyName("id")] long Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("desc")] string? Desc,
    [property: JsonPropertyName("total")] int? Total,
    [property: JsonPropertyName("isFinalized")] bool IsFinalized,
    [property: JsonPropertyName("isPrincipal")] bool IsPrincipal,
    [property: JsonPropertyName("permiteGameplay")] bool PermiteGameplay,
    [property: JsonPropertyName("subAlbumId")] long? SubAlbumId,
    [property: JsonPropertyName("rarities")] List<RaridadeResponse> Rarities,
    [property: JsonPropertyName("stickers")] List<FigurinhaResponse> Stickers,
    [property: JsonPropertyName("packs")] List<PacoteResponse> Packs,
    [property: JsonPropertyName("subAlbum")] AlbumDetalheResponse? SubAlbum
);
