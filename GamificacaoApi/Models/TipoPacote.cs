namespace GamificacaoApi.Models;

public class TipoPacote
{
    // Id vem do front-end (ex: "p_174920192")
    public required string Id { get; set; }

    public required long AlbumId { get; set; }
    public Album? Album { get; set; }

    public required string Nome { get; set; }
    public string? Template { get; set; } // identificador visual da Fabrica de Albuns (ex: "pack-5pts") - nao usado em regra de negocio
    public long? CustoMoedas { get; set; } // preenchido quando a Loja existir

    // Guardado em jsonb (conversor configurado no DbContext) - ver RegrasDrop.cs
    public required RegrasDrop RegrasDrop { get; set; }

    public bool Ativo { get; set; } = true;
}
