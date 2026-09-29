namespace GamificacaoApi.Models;

public class Album
{
    // Id normal, gerado pelo banco (BIGSERIAL) - igual qualquer outra
    // entidade com ID numerico do sistema. So os filhos (raridade/figurinha/
    // pacote) continuam com ID string vindo do front.
    public long Id { get; set; }

    public required string Nome { get; set; }
    public string? Descricao { get; set; }
    public int? Total { get; set; }

    // Trava de edicao setada pelo front (Fabrica de Albuns) - uma vez true,
    // o backend bloqueia exclusao de filhos (raridade/figurinha/pacote),
    // so permite adicionar coisa nova. Enquanto false, tratamos como
    // rascunho (nao aparece na listagem publica, so no admin).
    public bool IsFinalized { get; set; } = false;

    // Apenas UM album pode ter IsPrincipal == true por vez - e o que abre
    // por padrao na tela inicial do jogador. Validado na camada de servico,
    // nao no schema.
    public bool IsPrincipal { get; set; } = false;

    // false = "Colecao Historica" (read-only) - usuario visualiza mas o
    // backend bloqueia qualquer alteracao de inventario (abrir pacote,
    // trocar, forjar). true = economia viva.
    public bool PermiteGameplay { get; set; } = true;

    // Album legado vinculado a este album principal (ex: a sub-colecao
    // "legado" da Copa, agora generalizada). Auto-referencia, opcional.
    public long? SubAlbumId { get; set; }
    public Album? SubAlbum { get; set; }

    public string? ImagemCapa { get; set; }
    public DateTime? DataInicio { get; set; }
    public DateTime? DataFim { get; set; }
    public DateTime CriadoEm { get; set; }

    public List<Raridade> Raridades { get; set; } = [];
    public List<Figurinha> Figurinhas { get; set; } = [];
    public List<TipoPacote> TiposPacote { get; set; } = [];
}
