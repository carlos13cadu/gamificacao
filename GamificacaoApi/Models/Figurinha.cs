namespace GamificacaoApi.Models;

public class Figurinha
{
    // Id continua string (ex: "s_1", "s_trophy") - vem do front.
    public required string Id { get; set; }

    public required long AlbumId { get; set; }
    public Album? Album { get; set; }

    public required string RaridadeId { get; set; }
    public Raridade? Raridade { get; set; }

    public required string Nome { get; set; }
    public string? ImagemUrl { get; set; } // wire name confirmado: "image"

    public bool IsSecreta { get; set; } = false; // wire name confirmado: "isSecret"

    // Trava de seguranca: figurinhas com true NUNCA dropam em pacote, nunca
    // entram na forja (nem como base nem como catalisador), e nunca podem
    // ser deletadas no admin - independente de estarem ou nao em uso.
    // Wire name confirmado: "isTrophy"
    public bool IsTrofeu { get; set; } = false;

    // Passiva: texto visual (livre, so pra exibicao) + regra livre (string,
    // nao necessariamente JSON - o exemplo confirmado manda "def >= 5" como
    // texto puro). Wire names confirmados: "passiveDesc" / "passiveRule".
    public string? PassivaDesc { get; set; }
    public string? Passiva { get; set; }
}
