using GamificacaoApi.Models.Enums;

namespace GamificacaoApi.Models;

public class Jogo
{
    public long Id { get; set; }
    public long FaseId { get; set; }
    public Fase? Fase { get; set; }
    public required string Mandante { get; set; }
    public required string Visitante { get; set; }
    public DateTime DataHora { get; set; }
    public int? GolsMandante { get; set; }
    public int? GolsVisitante { get; set; }
    public StatusJogo Status { get; set; } = StatusJogo.Agendado;
}
