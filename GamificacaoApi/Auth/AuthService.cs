using System.Net;
using GamificacaoApi.Auth.Dto;
using GamificacaoApi.Common;
using GamificacaoApi.Data;
using GamificacaoApi.Models;
using GamificacaoApi.Models.Enums;
using GamificacaoApi.Security;
using Microsoft.EntityFrameworkCore;

namespace GamificacaoApi.Auth;

public class AuthService(AppDbContext db, JwtService jwtService)
{
    public async Task<AuthResponse> RegistrarAsync(RegisterRequest request)
    {
        bool nomeEmUso = await db.Usuarios.AnyAsync(u => u.Nome == request.Nome);
        if (nomeEmUso)
        {
            throw new RegraNegocioException(
                "NOME_EM_USO", "Esse nome de usuario ja esta em uso", HttpStatusCode.Conflict);
        }

        var usuario = new Usuario
        {
            Nome = request.Nome,
            Email = request.Email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(request.Senha),
            Papel = PapelUsuario.Usuario,
            SaldoMoedas = 0
        };

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();

        string token = jwtService.GerarToken(usuario.Id, usuario.Nome, usuario.Papel.ToString());
        return new AuthResponse(token, usuario.Id, usuario.Nome, usuario.Papel.ToString());
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Nome == request.Nome);

        if (usuario is null || !BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash))
        {
            throw new RegraNegocioException(
                "CREDENCIAIS_INVALIDAS", "Nome de usuario ou senha invalidos", HttpStatusCode.Unauthorized);
        }

        string token = jwtService.GerarToken(usuario.Id, usuario.Nome, usuario.Papel.ToString());
        return new AuthResponse(token, usuario.Id, usuario.Nome, usuario.Papel.ToString());
    }
}
