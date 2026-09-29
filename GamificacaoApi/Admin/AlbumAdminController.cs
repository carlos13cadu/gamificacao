using GamificacaoApi.Admin.Dto;
using GamificacaoApi.Albuns.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GamificacaoApi.Admin;

[ApiController]
[Route("api/v1/admin/albuns")]
[Authorize(Roles = "Admin")]
public class AlbumAdminController(AlbumAdminService service) : ControllerBase
{
    /// <summary>Cria um album novo - o Id e gerado pelo banco e devolvido na resposta.</summary>
    [HttpPost]
    public async Task<ActionResult<AlbumDetalheResponse>> Criar(AlbumSalvarRequest request)
    {
        var resultado = await service.CriarAsync(request);
        return StatusCode(StatusCodes.Status201Created, resultado);
    }

    /// <summary>Atualiza um album existente - sincroniza raridades/figurinhas/pacotes por diff.</summary>
    [HttpPut("{id:long}")]
    public async Task<AlbumDetalheResponse> Atualizar(long id, AlbumSalvarRequest request)
        => await service.AtualizarAsync(id, request);

    // 🚀 NOVO ENDPOINT DE EXCLUSÃO AQUI!
    /// <summary>Deleta um album existente, bloqueando caso já esteja finalizado.</summary>
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Deletar(long id)
    {
        await service.DeletarAsync(id);
        return NoContent(); // 204 No Content - Sucesso, sem corpo de resposta
    }
}