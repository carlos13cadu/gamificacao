namespace GamificacaoApi.Models;

// Log de auditoria (insert-only) de toda concessao de pacote - mesma
// filosofia do livro-razao de moedas (MoedaTransacao). UsuarioPacote.Quantidade
// e a soma pratica; este log e o "de onde veio" de cada concessao.
public class PacotesConcedidos
{
    public long Id { get; set; }
    public long UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public required string TipoPacoteId { get; set; }
    public TipoPacote? TipoPacote { get; set; }
    public int Quantidade { get; set; }
    public required string Origem { get; set; } // ex: missao, compra_loja, minigame, admin
    public DateTime CriadoEm { get; set; }
}
