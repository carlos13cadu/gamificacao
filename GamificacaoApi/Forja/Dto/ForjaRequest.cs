using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace GamificacaoApi.Forja.Dto;

// CatalystId (o "slot de risco") e OPCIONAL - sem ele, a forja funciona
// como uma sintese comum dentro do album legado (sem explosao, sem bonus).
// So com ele presente e que entra a chance de 35% de explosao e os premios
// melhores.
public record ForjaRequest(
    [property: JsonPropertyName("stickerIds")] [Required] List<string> StickerIds,
    [property: JsonPropertyName("catalystId")] string? CatalystId
);