namespace GamificacaoApi.Models;

public class UsuarioInsignia
{
    public long UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }

    public long InsigniaId { get; set; }
    public Insignia? Insignia { get; set; }

    public DateTime DesbloqueadoEm { get; set; } = DateTime.UtcNow;
}