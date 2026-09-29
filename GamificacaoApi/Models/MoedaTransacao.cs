using GamificacaoApi.Models.Enums;

namespace GamificacaoApi.Models;

public class MoedaTransacao
{
    public long Id { get; set; }
    public long UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public TipoTransacaoMoeda Tipo { get; set; }
    public long Quantidade { get; set; }
    public required string Origem { get; set; }
    public long? ReferenciaId { get; set; }
    public DateTime CriadoEm { get; set; }
}
