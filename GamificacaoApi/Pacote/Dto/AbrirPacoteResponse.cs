using System.Text.Json.Serialization;

namespace GamificacaoApi.Pacote.Dto;

public record AbrirPacoteResponse(
    [property: JsonPropertyName("stickers")] List<FigurinhaSorteadaResponse> Stickers
);
