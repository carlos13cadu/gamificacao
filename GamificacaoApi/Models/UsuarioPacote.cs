namespace GamificacaoApi.Models;

// Contador de quantos pacotes de cada tipo o usuario tem NAO ABERTOS.
// Substitui o modelo anterior de instancia individual - mais simples pro
// front consumir (so precisa saber "quantos", nao rastrear id de instancia).
// O historico de origem de cada pacote concedido fica em PacotesConcedidos.
public class UsuarioPacote
{
    public long Id { get; set; }
    public long UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public required string TipoPacoteId { get; set; }
    public TipoPacote? TipoPacote { get; set; }
    public int Quantidade { get; set; } = 0;
    public DateTime AtualizadoEm { get; set; }
}
