using System.ComponentModel.DataAnnotations;

namespace GamificacaoApi.Auth.Dto;

public record LoginRequest(
    [Required(ErrorMessage = "Nome e obrigatorio")]
    string Nome,

    [Required(ErrorMessage = "Senha e obrigatoria")]
    string Senha
);
