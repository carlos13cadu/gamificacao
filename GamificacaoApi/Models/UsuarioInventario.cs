namespace GamificacaoApi.Models;

public class UsuarioInventario
{
    public long Id { get; set; }
    public long UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public required string FigurinhaId { get; set; }
    public Figurinha? Figurinha { get; set; }
    public int Quantidade { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
