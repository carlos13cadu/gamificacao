using GamificacaoApi.Data;
using GamificacaoApi.Usuarios.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GamificacaoApi.Usuarios;

[ApiController]
[Route("api/v1/usuarios")]
[Authorize]
public class UsuarioController(AppDbContext db) : ControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult> Me()
    {
        string nomeUsuario = User.Identity!.Name!; 
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Nome == nomeUsuario);
        if (usuario is null) return Unauthorized();

        // Retornando um objeto anônimo temporário só para não quebrar rotas antigas
        return Ok(new { usuario.Id, usuario.Nome, usuario.Email, Papel = usuario.Papel.ToString(), usuario.SaldoMoedas });
    }

    [HttpGet("perfil")]
    public async Task<ActionResult<PerfilResponse>> ObterPerfil()
    {
        string nomeUsuario = User.Identity!.Name!; 
        
        var usuario = await db.Usuarios
            .FirstOrDefaultAsync(u => u.Nome == nomeUsuario);

        if (usuario is null) return Unauthorized();

        // 1. Busca as Figurinhas do Inventário
        var inventario = await db.UsuarioInventarios
            .Include(i => i.Figurinha)
            .ThenInclude(f => f.Raridade)
            .Where(i => i.UsuarioId == usuario.Id && i.Quantidade > 0)
            .Select(i => i.Figurinha)
            .Distinct()
            .ToListAsync();

        var avatares = inventario.Select(f => new AvatarResponse(
            f!.Id,
            f.Nome,
            f.ImagemUrl,
            f.Raridade?.CorHex ?? "#E05206"
        )).ToList();

        // Avatar Padrão (Sempre liberado)
        avatares.Insert(0, new AvatarResponse("padrao", "Recruta", "https://api.dicebear.com/7.x/bottts/svg?seed=cyber", "#94a3b8"));

        // 2. 🚀 BUSCA AS INSÍGNIAS NO BANCO DE DADOS
        var insignias = await db.UsuarioInsignias
            .Include(ui => ui.Insignia)
            .Where(ui => ui.UsuarioId == usuario.Id)
            .Select(ui => new BadgeResponse(
                ui.Insignia!.Id.ToString(),
                ui.Insignia.Nome,
                ui.Insignia.Descricao,
                ui.Insignia.Icone,
                ui.DesbloqueadoEm.ToString("yyyy-MM-dd")
            ))
            .ToListAsync();

        int xpProximoLevel = usuario.Level * 1000;

        return new PerfilResponse(
            usuario.CriadoEm, 
            usuario.Xp,
            usuario.Level,
            xpProximoLevel,
            usuario.AvatarFigurinhaId, // 🚀 Devolve a escolha salva
            avatares,
            insignias // 🚀 Envia a lista pro React renderizar!
        );
    }

    [HttpPost("avatar")]
    public async Task<IActionResult> AtualizarAvatar([FromBody] AtualizarAvatarRequest request)
    {
        string nomeUsuario = User.Identity!.Name!; 
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Nome == nomeUsuario);
        
        if (usuario == null) return Unauthorized();

        usuario.AvatarFigurinhaId = request.FigurinhaId == "padrao" ? null : request.FigurinhaId;
        await db.SaveChangesAsync();

        return NoContent();
    }

}