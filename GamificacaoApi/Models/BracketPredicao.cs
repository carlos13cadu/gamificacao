namespace GamificacaoApi.Models;

public class BracketPredicao
{
    public long Id { get; set; }
    public long UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public long CompeticaoId { get; set; }
    public Competicao? Competicao { get; set; }
    public required string Payload { get; set; } // jsonb - arvore de previsoes do mata-mata
    public int PontosRealizados { get; set; }
    public string? PremiosResgatados { get; set; } // jsonb
    public DateTime AtualizadoEm { get; set; }
}
