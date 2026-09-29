namespace GamificacaoApi.Models;

public class ChatMensagem
{
    public long Id { get; set; }
    public long UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public required string Mensagem { get; set; }
    public DateTime CriadoEm { get; set; }
}
