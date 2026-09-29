using GamificacaoApi.Auth.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GamificacaoApi.Auth;

[ApiController]
[Route("api/v1/auth")]
[AllowAnonymous]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var resposta = await authService.RegistrarAsync(request);
        return StatusCode(StatusCodes.Status201Created, resposta);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        return Ok(await authService.LoginAsync(request));
    }
}
