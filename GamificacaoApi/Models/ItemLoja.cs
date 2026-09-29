using GamificacaoApi.Models.Enums;

namespace GamificacaoApi.Models;

public class ItemLoja
{
    public long Id { get; set; }
    public required string Nome { get; set; }
    public required string Descricao { get; set; } // Novo: Útil para explicar a camisa ou a regra do pacote
    
    public TipoItemLoja Tipo { get; set; }
    
    public string? FigurinhaId { get; set; }
    public Figurinha? Figurinha { get; set; }
    public string? TipoPacoteId { get; set; }
    public TipoPacote? TipoPacote { get; set; }
    
    public long? AlbumId { get; set; }
    public Album? Album { get; set; }
    
    // 🚀 Novos campos Visuais e de Estoque
    public string? ImagemUrl { get; set; } // Para produtos físicos ou pacotes customizados
    
    // Se for null, o estoque é infinito. Se for 1, é item único no mundo!
    public int? EstoqueGlobal { get; set; } 
    
    // Se for null, pode comprar quantas vezes quiser. Se for 1, só compra uma vez na vida.
    public int? LimitePorUsuario { get; set; } 

    public long PrecoMoedas { get; set; }
    public DateTime? DisponivelDe { get; set; }
    public DateTime? DisponivelAte { get; set; }
    public bool Ativo { get; set; } = true;
}