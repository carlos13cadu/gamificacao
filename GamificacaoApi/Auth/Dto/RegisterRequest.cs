using System.ComponentModel.DataAnnotations;

namespace GamificacaoApi.Auth.Dto;

public record RegisterRequest(
    [Required(ErrorMessage = "Nome e obrigatorio")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Nome deve ter entre 3 e 100 caracteres")]
    string Nome,

    string? Email,

    [Required(ErrorMessage = "Senha e obrigatoria")]
    [MinLength(6, ErrorMessage = "Senha deve ter no minimo 6 caracteres")]
    string Senha
);
