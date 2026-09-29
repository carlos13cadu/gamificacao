using GamificacaoApi.Albuns.Dto;
using GamificacaoApi.Security;
using Microsoft.AspNetCore.Mvc;

namespace GamificacaoApi.Albuns;

[ApiController]
[Route("api/v1/albuns")]
public class AlbumController(AlbumService albumService) : ControllerBase
{
    [HttpGet]
    public async Task<List<AlbumResumoResponse>> Listar()
    {
        long usuarioId = User.ObterUsuarioId();
        return await albumService.ListarAlbunsAsync(usuarioId);
    }

    // ENDPOINT: Rota exclusiva para a Fábrica ler tudo
    [HttpGet("todos-admin")]
    public async Task<List<AlbumResumoResponse>> ListarTodosAdmin()
    {
        return await albumService.ListarTodosAlbunsAdminAsync();
    }

    [HttpGet("principal")]
    public async Task<AlbumDetalheResponse> Principal() => await albumService.GetPrincipalAsync();

    [HttpGet("{albumId:long}")]
    public async Task<AlbumDetalheResponse> Catalogo(long albumId) => await albumService.GetCatalogoAsync(albumId);

    [HttpGet("{albumId:long}/inventario")]
    public async Task<InventarioResponse> Inventario(long albumId)
    {
        long usuarioId = User.ObterUsuarioId();
        return await albumService.GetInventarioAsync(albumId, usuarioId);
    }

    [HttpGet("{albumId:long}/inventario/{alvoUsuarioId:long}")]
    public async Task<InventarioResponse> InventarioAlvo(long albumId, long alvoUsuarioId)
    {
        return await albumService.GetInventarioAsync(albumId, alvoUsuarioId);
    }

    [HttpPost("{albumId:long}/completar")]
    public async Task<IActionResult> Completar(long albumId)
    {
        long usuarioId = User.ObterUsuarioId();
        var mensagem = await albumService.ResgatarTrofeuAsync(albumId, usuarioId);
        return Ok(new { message = mensagem });
    }
}