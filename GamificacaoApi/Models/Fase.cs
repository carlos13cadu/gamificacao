using GamificacaoApi.Models.Enums;

namespace GamificacaoApi.Models;

public class Fase
{
    public long Id { get; set; }
    public long CompeticaoId { get; set; }
    public Competicao? Competicao { get; set; }
    public required string Nome { get; set; }
    public int Ordem { get; set; }
    public FormatoFase Formato { get; set; }
}
