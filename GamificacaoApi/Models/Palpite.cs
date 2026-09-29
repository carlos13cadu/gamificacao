namespace GamificacaoApi.Models;

public class Palpite
{
    public long Id { get; set; }
    public long UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public long JogoId { get; set; }
    public Jogo? Jogo { get; set; }
    public int PalpiteMandante { get; set; }
    public int PalpiteVisitante { get; set; }
    public int? PontosObtidos { get; set; }
    public DateTime CriadoEm { get; set; }
}
