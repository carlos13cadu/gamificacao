using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace GamificacaoApi.Pacote.Dto;

public record AbrirPacoteRequest(
    [property: JsonPropertyName("packId")] [Required] string PackId
);
