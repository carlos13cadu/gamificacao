namespace GamificacaoApi.Models;

public class Raridade
{
    // Id continua string (ex: "r_1", "r_trophy") - vem do front.
    public required string Id { get; set; }

    public required long AlbumId { get; set; }
    public Album? Album { get; set; }

    public required string Nome { get; set; }
    public string? CorHex { get; set; }

    // Ordem de exibicao - NAO vem no payload do front (o contrato TS
    // Rarity nao tem esse campo). Derivada da posicao no array "rarities"
    // no momento do save, nao e um dado que o front manda explicitamente.
    public int Ordem { get; set; }

    // JSON wire name confirmado: "weight". Usado pela Maquina de
    // Sintese/Forja pra calcular hierarquia e chance de sucesso (ex: 1 =
    // Comum, 10 = Rara, 999 = Trofeu). NAO e usado pro sorteio de pacote -
    // isso quem define e o "drops" de TipoPacote.RegrasDrop.
    public required int Peso { get; set; }
}
