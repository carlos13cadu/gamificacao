namespace GamificacaoApi.Models;

public class Compra
{
    public long Id { get; set; }
    public long UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public long ItemLojaId { get; set; }
    public ItemLoja? ItemLoja { get; set; }
    public long PrecoPago { get; set; }
    public DateTime CriadoEm { get; set; }
}
