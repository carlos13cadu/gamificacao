namespace GamificacaoApi.Models;

// Nomeado "LogEntry" (nao "Log") pra nao colidir com Microsoft.Extensions.Logging.
// Mapeia pra tabela "logs" (ver DbContext).
public class LogEntry
{
    public long Id { get; set; }
    public required string Nivel { get; set; }
    public long? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public required string Mensagem { get; set; }
    public DateTime CriadoEm { get; set; }
}
