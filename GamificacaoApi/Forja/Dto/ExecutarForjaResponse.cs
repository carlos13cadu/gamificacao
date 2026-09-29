using System.Text.Json.Serialization;
using GamificacaoApi.Pacote.Dto;

namespace GamificacaoApi.Forja.Dto;

// status: "explosion" (perdeu tudo, results vazio), "upgrade", "jump", "same"
public record ExecutarForjaResponse(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("results")] List<FigurinhaSorteadaResponse> Results
);