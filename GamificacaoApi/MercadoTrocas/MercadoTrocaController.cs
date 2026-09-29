using GamificacaoApi.MercadoTrocas.Dto;
using GamificacaoApi.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GamificacaoApi.MercadoTrocas;

[ApiController]
[Route("api/v1/mercado-trocas")]
[Authorize]
public class MercadoTrocaController(MercadoTrocaService service) : ControllerBase
{
    [HttpGet("mapeamento/{albumId:long}")]
    public async Task<IActionResult> GetMapeamento(long albumId) // 🚀 Corrigido para IActionResult
    {
        long usuarioId = User.ObterUsuarioId();
        var mapa = await service.GetMapeamentoAsync(usuarioId, albumId);
        return Ok(new { status = "success", mapa });
    }

    [HttpGet("pendentes")]
    public async Task<IActionResult> ListarPendentes() // 🚀 Corrigido para IActionResult
    {
        long usuarioId = User.ObterUsuarioId();
        var trocas = await service.ListarPropostasAsync(usuarioId);
        return Ok(new { status = "success", trocas });
    }

    [HttpGet("inventario-alvo/{albumId:long}/{alvoUsuarioId:long}")]
    public async Task<IActionResult> GetInventarioAlvo(long albumId, long alvoUsuarioId)
    {
        var figurinhas = await service.GetInventarioAlvoParaTrocaAsync(albumId, alvoUsuarioId);
        return Ok(new { status = "success", figurinhas });
    }

    [HttpPost("propor")]
    public async Task<IActionResult> CriarProposta([FromBody] NovaTrocaRequest request)
    {
        long usuarioId = User.ObterUsuarioId();
        await service.CriarPropostaAsync(usuarioId, request);
        return Ok(new { status = "success", msg = "Proposta enviada com sucesso!" });
    }

    [HttpPost("responder/{trocaId:long}")]
    public async Task<IActionResult> ResponderTroca(long trocaId, [FromBody] ResponderTrocaRequest request)
    {
        long usuarioId = User.ObterUsuarioId();
        await service.ResponderTrocaAsync(usuarioId, trocaId, request.Resposta);
        return Ok(new { status = "success", msg = "Troca processada!" });
    }
}