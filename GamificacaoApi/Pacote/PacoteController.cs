using GamificacaoApi.Pacote.Dto;
using GamificacaoApi.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GamificacaoApi.Pacote;

[ApiController]
[Route("api/v1")]
public class PacoteController(PacoteService pacoteService) : ControllerBase
{
    [HttpPost("pacotes/abrir")]
    public async Task<AbrirPacoteResponse> Abrir(AbrirPacoteRequest request)
    {
        long usuarioId = User.ObterUsuarioId();
        return await pacoteService.AbrirAsync(usuarioId, request.PackId);
    }

    /// <summary>
    /// Endpoint de integracao pra minigames/eventos premiarem pacotes.
    /// Restrito a Admin por enquanto - se minigames rodarem como um servico
    /// separado (nao um admin logado), isso vai precisar de autenticacao
    /// servico-a-servico (API key/client-credentials) no lugar de JWT de
    /// usuario. Ainda nao decidido - confirmar antes de abrir pra producao.
    /// </summary>
    [HttpPost("albuns/pacotes/conceder")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Conceder(ConcederPacoteRequest request)
    {
        await pacoteService.ConcederAsync(request.UserId, request.PackId, request.Quantity, request.Origin);
        return NoContent();
    }
}
