using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace GamificacaoApi.Pacote.Dto;

public record ConcederPacoteRequest(
    [property: JsonPropertyName("userId")] [Required] long UserId,
    [property: JsonPropertyName("packId")] [Required] string PackId,
    [property: JsonPropertyName("quantity")] [Range(1, int.MaxValue)] int Quantity,
    [property: JsonPropertyName("origin")] string Origin = "minigame"
);
