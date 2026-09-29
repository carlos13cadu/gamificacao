using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace GamificacaoApi.Common;

/// <summary>
/// Equivalente ao @RestControllerAdvice do lado Java - centraliza o
/// tratamento de erro e devolve sempre { "mensagem": "...", "codigo": "..." },
/// o mesmo formato que ja foi combinado com o front.
/// </summary>
public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, erro) = exception switch
        {
            RegraNegocioException ex => ((int)ex.Status, new ApiErro(ex.Message, ex.Codigo)),
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized,
                new ApiErro("Nao autorizado", "NAO_AUTORIZADO")),
            _ => (StatusCodes.Status500InternalServerError,
                new ApiErro("Erro interno inesperado", "ERRO_INTERNO"))
        };

        if (status == StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Erro nao tratado");
        }

        httpContext.Response.StatusCode = status;
        await httpContext.Response.WriteAsJsonAsync(erro, cancellationToken);
        return true;
    }
}
