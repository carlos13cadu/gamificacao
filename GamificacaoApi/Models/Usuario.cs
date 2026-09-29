using GamificacaoApi.Models.Enums;

namespace GamificacaoApi.Models;

public class Usuario
{
    public long Id { get; set; }
    public required string Nome { get; set; }
    public string? Email { get; set; }
    public required string SenhaHash { get; set; }
    public PapelUsuario Papel { get; set; } = PapelUsuario.Usuario;
    public long SaldoMoedas { get; set; } = 0;
    public int Xp { get; set; } = 0;
    public int Level { get; set; } = 1;
    public string? AvatarFigurinhaId { get; set; } 
    public Figurinha? AvatarFigurinha { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
