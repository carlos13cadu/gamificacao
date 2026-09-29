using GamificacaoApi.Inventario.Dto;
using GamificacaoApi.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GamificacaoApi.Inventario;

[ApiController]
[Route("api/v1/inventario")]
[Authorize] // Exige que o usuário esteja logado com o token JWT
public class InventarioController(InventarioService service) : ControllerBase
{
    [HttpPost("coringa/usar")]
    public async Task<UsarCoringaResponse> UsarCoringa(UsarCoringaRequest request)
    {
        long usuarioId = User.ObterUsuarioId();
        return await service.UsarCoringaAsync(usuarioId, request);
    }
}