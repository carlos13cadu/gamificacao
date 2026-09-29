using GamificacaoApi.Models.Enums;

namespace GamificacaoApi.Models;

public class Competicao
{
    public long Id { get; set; }
    public required string Nome { get; set; }
    public string? Tipo { get; set; } // ex: copa_mundo, brasileirao, olimpiada
    public StatusCompeticao Status { get; set; } = StatusCompeticao.Planejada;
    public required string RegrasPontuacao { get; set; } // jsonb, livre - interpretado na aplicacao
    public DateTime? DataInicio { get; set; }
    public DateTime? DataFim { get; set; }
    public DateTime CriadoEm { get; set; }
}
