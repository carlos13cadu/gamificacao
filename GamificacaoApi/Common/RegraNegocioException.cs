using System.Net;

namespace GamificacaoApi.Common;

/// <summary>
/// Excecao para violacoes de regra de negocio (ex: nome de usuario em uso,
/// pacote ja aberto, item em uso nao pode ser removido). Cada modulo lanca
/// essa excecao com um codigo proprio - o front trata por codigo, sem
/// depender do texto da mensagem.
/// </summary>
public class RegraNegocioException(string codigo, string mensagem, HttpStatusCode status = HttpStatusCode.BadRequest)
    : Exception(mensagem)
{
    public string Codigo { get; } = codigo;
    public HttpStatusCode Status { get; } = status;
}
