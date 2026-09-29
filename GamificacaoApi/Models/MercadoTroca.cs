using GamificacaoApi.Models.Enums;

namespace GamificacaoApi.Models;

public class MercadoTroca
{
    public long Id { get; set; }
    
    public long DeUsuarioId { get; set; }
    public Usuario? DeUsuario { get; set; }
    
    // No seu sistema legado, a troca é sempre direcionada a um usuário específico
    public long ParaUsuarioId { get; set; } 
    public Usuario? ParaUsuario { get; set; }
    
    // A MÁGICA: Trocamos as strings simples por Listas de Strings!
    // O PostgreSQL vai salvar isso nativamente como arrays (text[]).
    public required List<string> OfereceFigurinhasIds { get; set; }
    public required List<string> QuerFigurinhasIds { get; set; }
    
    public StatusMercadoTroca Status { get; set; } = StatusMercadoTroca.Pendente;
    public DateTime CriadoEm { get; set; }
    public DateTime? RespondidoEm { get; set; }
}