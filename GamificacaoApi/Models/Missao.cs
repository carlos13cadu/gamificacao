using GamificacaoApi.Models.Enums;

namespace GamificacaoApi.Models;

public class Missao
{
    public long Id { get; set; }
    public long? AlbumId { get; set; }
    public Album? Album { get; set; }
    public required string Nome { get; set; }
    public required string TipoMeta { get; set; }
    public int MetaValor { get; set; }
    public string? RecompensaTipoPacoteId { get; set; }
    public TipoPacote? RecompensaTipoPacote { get; set; }
    public long? RecompensaMoedas { get; set; }
    public Periodicidade Periodicidade { get; set; } = Periodicidade.Semanal;
    public bool Ativo { get; set; } = true;
}
