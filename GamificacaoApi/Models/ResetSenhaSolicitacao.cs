using GamificacaoApi.Models.Enums;

namespace GamificacaoApi.Models;

public class ResetSenhaSolicitacao
{
    public long Id { get; set; }
    public long UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public required string Codigo { get; set; }
    public StatusResetSenha Status { get; set; } = StatusResetSenha.Pendente;
    public DateTime CriadoEm { get; set; }
}
