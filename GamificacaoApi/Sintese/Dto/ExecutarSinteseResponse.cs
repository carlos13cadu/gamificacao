using System.Text.Json.Serialization;
using GamificacaoApi.Pacote.Dto;

namespace GamificacaoApi.Sintese.Dto;

// status: "upgrade" (subiu de raridade), "jump" (pulou pra faixa secreta),
// "same" (ficou na mesma raridade da mais fraca usada - nunca abaixo)
public record ExecutarSinteseResponse(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("results")] List<FigurinhaSorteadaResponse> Results
);
