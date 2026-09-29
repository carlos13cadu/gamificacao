using GamificacaoApi.Forja.Dto;
using GamificacaoApi.Security;
using Microsoft.AspNetCore.Mvc;

namespace GamificacaoApi.Forja;

[ApiController]
[Route("api/v1/forja")]
public class ForjaController(ForjaService service) : ControllerBase
{
    [HttpPost("simular")]
    public async Task<SimularForjaResponse> Simular(ForjaRequest request)
    {
        long usuarioId = User.ObterUsuarioId();
        return await service.SimularAsync(usuarioId, request);
    }

    [HttpPost("executar")]
    public async Task<ExecutarForjaResponse> Executar(ForjaRequest request)
    {
        long usuarioId = User.ObterUsuarioId();
        return await service.ExecutarAsync(usuarioId, request);
    }
}
