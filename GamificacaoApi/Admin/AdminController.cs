using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GamificacaoApi.Data;
using GamificacaoApi.Models;

namespace GamificacaoApi.Controllers; // Se os seus controllers ficam em outra pasta, ajuste o namespace

[ApiController]
[Route("api/v1/admin")]
[Authorize]
public class AdminController(AppDbContext db) : ControllerBase
{
    // 1. Puxa a lista de usuários para o painel
    [HttpGet("usuarios")]
    public async Task<IActionResult> GetUsuarios()
    {
        var usuarios = await db.Usuarios
            .OrderBy(u => u.Nome)
            .Select(u => new { id = u.Id, nome = u.Nome })
            .ToListAsync();
            
        return Ok(new { status = "success", usuarios });
    }

    // 2. NOVO: Puxa os pacotes disponíveis para o álbum atual
    [HttpGet("pacotes/{albumId:long}")]
    public async Task<IActionResult> GetPacotesDoAlbum(long albumId)
    {
        var pacotes = await db.TiposPacote
            .Where(t => t.AlbumId == albumId)
            .Select(t => new { id = t.Id, nome = t.Nome })
            .ToListAsync();
            
        return Ok(new { status = "success", pacotes });
    }

    // 3. Dá os pacotinhos específicos para o usuário
    [HttpPost("dar-pacotes")]
    public async Task<IActionResult> DarPacotes([FromBody] DarPacoteRequest req)
    {
        var tipoPacote = await db.TiposPacote.FindAsync(req.TipoPacoteId);
        if (tipoPacote == null) 
            return BadRequest(new { message = "Pacote não encontrado no banco de dados." });

        var pacote = await db.UsuarioPacotes
            .FirstOrDefaultAsync(p => p.UsuarioId == req.UsuarioId && p.TipoPacoteId == req.TipoPacoteId);

        if (pacote != null)
        {
            pacote.Quantidade += req.Quantidade; 
        }
        else
        {
            db.UsuarioPacotes.Add(new UsuarioPacote 
            { 
                UsuarioId = req.UsuarioId, 
                TipoPacoteId = req.TipoPacoteId, 
                Quantidade = req.Quantidade 
            });
        }

        await db.SaveChangesAsync();
        return Ok(new { status = "success", message = $"{req.Quantidade}x '{tipoPacote.Nome}' enviado(s) com sucesso!" });
    }
}

// O DTO atualizado para receber o ID do Pacote exato
public class DarPacoteRequest
{
    public long UsuarioId { get; set; }
    public string TipoPacoteId { get; set; } = string.Empty;
    public int Quantidade { get; set; }
}