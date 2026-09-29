using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace GamificacaoApi.Inventario.Dto;

public record UsarCoringaRequest(
    [property: JsonPropertyName("targetStickerId")] [Required] string TargetStickerId
);