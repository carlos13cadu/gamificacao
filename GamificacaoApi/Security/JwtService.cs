using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace GamificacaoApi.Security;

/// <summary>
/// Gera e valida os JWT usados como Bearer token. Equivalente direto do
/// JwtService que fizemos em Java - so troca a biblioteca
/// (System.IdentityModel.Tokens.Jwt, que ja vem junto do pacote
/// Microsoft.AspNetCore.Authentication.JwtBearer).
/// </summary>
public class JwtService(IConfiguration configuration)
{
    private readonly string _segredo = configuration["Jwt:Secret"]
        ?? throw new InvalidOperationException("Jwt:Secret nao configurado");

    private readonly int _expiracaoMinutos = int.Parse(configuration["Jwt:ExpiracaoMinutos"] ?? "360");

    public string GerarToken(long usuarioId, string nomeUsuario, string papel)
    {
        var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_segredo));
        var credenciais = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, nomeUsuario),
            new("usuarioId", usuarioId.ToString()),
            new("role", papel)
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_expiracaoMinutos),
            signingCredentials: credenciais
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
