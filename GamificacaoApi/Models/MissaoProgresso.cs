namespace GamificacaoApi.Models;

public class MissaoProgresso
{
    public long Id { get; set; }
    public long UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public long MissaoId { get; set; }
    public Missao? Missao { get; set; }
    public required string PeriodoRef { get; set; } // ex: "2026-W27"
    public int Progresso { get; set; }
    public bool Resgatado { get; set; }
    public DateTime? ResgatadoEm { get; set; }
}
