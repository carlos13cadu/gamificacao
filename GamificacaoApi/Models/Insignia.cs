namespace GamificacaoApi.Models;

public class Insignia
{
    public long Id { get; set; }
    
    public required string Nome { get; set; }
    public required string Descricao { get; set; }
    
    // Pode ser um Emoji (ex: "⚡") ou a URL de uma imagem
    public required string Icone { get; set; } 
    
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    // Relacionamento com os usuários que possuem essa insígnia
    public ICollection<UsuarioInsignia> UsuariosInsignias { get; set; } = new List<UsuarioInsignia>();
}