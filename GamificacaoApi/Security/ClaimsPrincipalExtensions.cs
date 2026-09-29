using System.Security.Claims;

namespace GamificacaoApi.Security;

public static class ClaimsPrincipalExtensions
{
    public static long ObterUsuarioId(this ClaimsPrincipal user)
    {
        string valor = user.FindFirstValue("usuarioId")
            ?? throw new InvalidOperationException("Claim 'usuarioId' nao encontrada no token");
        return long.Parse(valor);
    }
}
