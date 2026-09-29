using GamificacaoApi.Security;
using GamificacaoApi.Sintese.Dto;
using Microsoft.AspNetCore.Mvc;

namespace GamificacaoApi.Sintese;

[ApiController]
[Route("api/v1/sintese")]
public class SinteseController(SinteseService service) : ControllerBase
{
    [HttpPost("simular")]
    public async Task<SimularSinteseResponse> Simular(SinteseRequest request)
    {
        long usuarioId = User.ObterUsuarioId();
        return await service.SimularAsync(usuarioId, request);
    }

    [HttpPost("executar")]
    public async Task<ExecutarSinteseResponse> Executar(SinteseRequest request)
    {
        long usuarioId = User.ObterUsuarioId();
        return await service.ExecutarAsync(usuarioId, request);
    }
}
