using System.Text.Json.Serialization;

namespace GamificacaoApi.Albuns.Dto;

public record FigurinhaComQuantidade(
    [property: JsonPropertyName("stickerId")] string StickerId,
    [property: JsonPropertyName("quantity")] int Quantity
);

public record PacoteComQuantidade(
    [property: JsonPropertyName("packId")] string PackId,
    [property: JsonPropertyName("packName")] string PackName,
    [property: JsonPropertyName("quantity")] int Quantity
);

public record InventarioResponse(
    [property: JsonPropertyName("stickers")] List<FigurinhaComQuantidade> Stickers,
    [property: JsonPropertyName("packs")] List<PacoteComQuantidade> Packs
);
