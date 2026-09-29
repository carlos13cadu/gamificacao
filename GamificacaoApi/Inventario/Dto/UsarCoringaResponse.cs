using System.Text.Json.Serialization;
using GamificacaoApi.Pacote.Dto;

namespace GamificacaoApi.Inventario.Dto;

public record UsarCoringaResponse(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("results")] List<FigurinhaSorteadaResponse> Results
);