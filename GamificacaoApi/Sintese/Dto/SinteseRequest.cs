using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace GamificacaoApi.Sintese.Dto;

public record SinteseRequest(
    [property: JsonPropertyName("stickerIds")] [Required] List<string> StickerIds,
    [property: JsonPropertyName("catalystId")] string? CatalystId
);
