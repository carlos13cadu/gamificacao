using System.Text.Json.Serialization;

namespace GamificacaoApi.Albuns.Dto;

public record RaridadeResponse(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("color")] string? Color,
    [property: JsonPropertyName("weight")] int Weight,
    // extra, alem do contrato TS confirmado - o front pode ignorar se nao usar
    [property: JsonPropertyName("ordem")] int Ordem
);
