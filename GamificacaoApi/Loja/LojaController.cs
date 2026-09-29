using GamificacaoApi.Data;
using GamificacaoApi.Models;
using GamificacaoApi.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GamificacaoApi.Loja;

public record LojaItemResponse(
    long Id,
    string Nome,
    string Descricao,
    string Tipo,
    string? ImagemUrl,
    long PrecoMoedas,
    int? EstoqueGlobal,
    int? LimitePorUsuario,
    int JaCompradosPeloUsuario
);

public record ComprarItemRequest(long ItemId);

[ApiController]
[Route("api/v1/loja")]
[Authorize]
public class LojaController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> ObterVitrine()
    {
        string nomeUsuario = User.Identity!.Name!;
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Nome == nomeUsuario);
        if (usuario is null) return Unauthorized();

        var itensLoja = await db.ItensLoja
            .Include(i => i.Album)
            .Include(i => i.TipoPacote).ThenInclude(tp => tp!.Album)
            .Include(i => i.Figurinha).ThenInclude(f => f!.Album)
            .Where(i => i.Ativo)
            .ToListAsync();

        var itensValidos = itensLoja.Where(item => 
        {
            if (item.Tipo == TipoItemLoja.Pacote) return item.TipoPacote?.Album?.PermiteGameplay == true;
            if (item.Tipo == TipoItemLoja.Figurinha) return item.Figurinha?.Album?.PermiteGameplay == true;
            if (item.AlbumId != null) return item.Album?.PermiteGameplay == true;
            return true; 
        }).ToList();

        var comprasUsuario = await db.Compras
            .Where(c => c.UsuarioId == usuario.Id)
            .ToListAsync();

        var vitrine = new List<LojaItemResponse>();

        foreach (var item in itensValidos)
        {
            int comprados;
            
            // 🚀 A MÁGICA VISUAL: Pega a URL padrão, MAS se for pacote, puxa o Template oficial do Álbum!
            string? urlVisual = item.ImagemUrl;
            if (item.Tipo == TipoItemLoja.Pacote && item.TipoPacote != null)
            {
                urlVisual = item.TipoPacote.Template; 
            }

            if (item.Tipo == TipoItemLoja.OfertaDiaria)
            {
                comprados = comprasUsuario.Count(c => c.ItemLojaId == item.Id && c.CriadoEm.Date == DateTime.UtcNow.Date);
                
                var figurinhaDiaria = await SortearFigurinhaDiaria(usuario.Id);
                if (figurinhaDiaria != null)
                {
                    vitrine.Add(new LojaItemResponse(
                        item.Id, $"Carta do Dia: {figurinhaDiaria.Nome}", "Sua oferta exclusiva que reseta à meia-noite!",
                        item.Tipo.ToString(), figurinhaDiaria.ImagemUrl, item.PrecoMoedas, item.EstoqueGlobal, item.LimitePorUsuario, comprados
                    ));
                }
                continue;
            }
            else
            {
                comprados = comprasUsuario.Count(c => c.ItemLojaId == item.Id);
            }

            vitrine.Add(new LojaItemResponse(
                item.Id, item.Nome, item.Descricao, item.Tipo.ToString(),
                urlVisual, item.PrecoMoedas, item.EstoqueGlobal, item.LimitePorUsuario, comprados
            ));
        }

        return Ok(new { saldo = usuario.SaldoMoedas, itens = vitrine });
    }

    [HttpPost("comprar")]
    public async Task<ActionResult> Comprar([FromBody] ComprarItemRequest request)
    {
        string nomeUsuario = User.Identity!.Name!;
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Nome == nomeUsuario);
        if (usuario is null) return Unauthorized();

        var item = await db.ItensLoja.FirstOrDefaultAsync(i => i.Id == request.ItemId);
        if (item is null || !item.Ativo) return BadRequest("Item não encontrado ou inativo.");

        var agora = DateTime.UtcNow;
        if (item.DisponivelDe.HasValue && agora < item.DisponivelDe.Value) return BadRequest("Item ainda não disponível.");
        if (item.DisponivelAte.HasValue && agora > item.DisponivelAte.Value) return BadRequest("Item expirado.");

        if (usuario.SaldoMoedas < item.PrecoMoedas) return BadRequest("Saldo insuficiente.");

        if (item.EstoqueGlobal.HasValue)
        {
            var comprasGlobais = await db.Compras.CountAsync(c => c.ItemLojaId == item.Id);
            if (comprasGlobais >= item.EstoqueGlobal.Value) return BadRequest("Estoque global esgotado.");
        }

        if (item.LimitePorUsuario.HasValue)
        {
            int comprasUsuario;
            if (item.Tipo == TipoItemLoja.OfertaDiaria) 
            {
                comprasUsuario = await db.Compras.CountAsync(c => c.ItemLojaId == item.Id && c.UsuarioId == usuario.Id && c.CriadoEm.Date == DateTime.UtcNow.Date);
            } 
            else 
            {
                comprasUsuario = await db.Compras.CountAsync(c => c.ItemLojaId == item.Id && c.UsuarioId == usuario.Id);
            }

            if (comprasUsuario >= item.LimitePorUsuario.Value) return BadRequest("Você já atingiu seu limite para este item.");
        }

        using var transaction = await db.Database.BeginTransactionAsync();
        try
        {
            usuario.SaldoMoedas -= item.PrecoMoedas;

            db.Compras.Add(new Compra
            {
                UsuarioId = usuario.Id,
                ItemLojaId = item.Id,
                PrecoPago = item.PrecoMoedas,
                CriadoEm = DateTime.UtcNow
            });

            if (item.Tipo == TipoItemLoja.OfertaDiaria)
            {
                var figurinhaDiaria = await SortearFigurinhaDiaria(usuario.Id);
                if (figurinhaDiaria == null) throw new Exception("Erro ao gerar carta diária.");
                await EntregarFigurinha(usuario.Id, figurinhaDiaria.Id);
            }
            else if (item.Tipo == TipoItemLoja.Pacote)
            {
                if (string.IsNullOrEmpty(item.TipoPacoteId)) throw new Exception("Pacote não configurado na loja.");
                await EntregarPacote(usuario.Id, item.TipoPacoteId);
            }
            else if (item.Tipo == TipoItemLoja.Figurinha)
            {
                if (string.IsNullOrEmpty(item.FigurinhaId)) throw new Exception("Figurinha não configurada na loja.");
                await EntregarFigurinha(usuario.Id, item.FigurinhaId);
            }

            await db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { mensagem = "Compra realizada com sucesso!", novoSaldo = usuario.SaldoMoedas });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(); 
            return StatusCode(500, new { mensagem = "Erro ao processar a compra.", detalhe = ex.Message });
        }
    }

    private async Task EntregarFigurinha(long usuarioId, string figurinhaId)
    {
        var inventario = await db.UsuarioInventarios
            .FirstOrDefaultAsync(i => i.UsuarioId == usuarioId && i.FigurinhaId == figurinhaId);
            
        if (inventario != null) {
            inventario.Quantidade += 1;
        } else {
            db.UsuarioInventarios.Add(new UsuarioInventario { 
                UsuarioId = usuarioId, 
                FigurinhaId = figurinhaId, 
                Quantidade = 1 
            });
        }
    }

    private async Task EntregarPacote(long usuarioId, string tipoPacoteId)
    {
        var pacote = await db.UsuarioPacotes
            .FirstOrDefaultAsync(p => p.UsuarioId == usuarioId && p.TipoPacoteId == tipoPacoteId);
            
        if (pacote != null) {
            pacote.Quantidade += 1; 
        } else {
            db.UsuarioPacotes.Add(new UsuarioPacote { 
                UsuarioId = usuarioId, 
                TipoPacoteId = tipoPacoteId, 
                Quantidade = 1 
            });
        }
    }

    private async Task<Figurinha?> SortearFigurinhaDiaria(long usuarioId)
    {
        var raridades = await db.Raridades.OrderBy(r => r.Peso).ToListAsync();
        if (!raridades.Any()) return null;

        int menorPeso = raridades.First().Peso;

        var figurinhasElegiveis = await db.Figurinhas
            .Include(f => f.Raridade)
            .Include(f => f.Album)
            .Where(f => f.Raridade!.Peso > menorPeso && f.Album!.PermiteGameplay == true)
            .OrderBy(f => f.Id) 
            .ToListAsync();

        if (!figurinhasElegiveis.Any()) return null;

        int seed = usuarioId.GetHashCode() ^ DateTime.UtcNow.Date.GetHashCode();
        var random = new Random(seed);

        int index = random.Next(figurinhasElegiveis.Count);
        return figurinhasElegiveis[index];
    }

    // ==========================================
    // ÁREA DO ADMIN
    // ==========================================

    // 🚀 DTO Atualizado (TemplateVisual removido)
    public record AdicionarPacoteRequest(string TipoPacoteId, long PrecoMoedas, int? EstoqueGlobal, int? LimitePorUsuario, string Descricao);

    [HttpGet("admin/pacotes-disponiveis")]
    public async Task<ActionResult> ObterPacotesParaLoja()
    {
        var pacotes = await db.TiposPacote
            .Include(tp => tp.Album)
            .Where(tp => tp.Album!.PermiteGameplay)
            .Select(tp => new { 
                Id = tp.Id, 
                Nome = tp.Nome, 
                AlbumNome = tp.Album!.Nome 
            })
            .ToListAsync();
            
        return Ok(pacotes);
    }

    [HttpPost("admin/adicionar-pacote")]
    public async Task<ActionResult> AdicionarPacoteNaLoja([FromBody] AdicionarPacoteRequest request)
    {
        var pacote = await db.TiposPacote
            .Include(tp => tp.Album)
            .FirstOrDefaultAsync(tp => tp.Id == request.TipoPacoteId);
            
        if (pacote == null) return BadRequest("Pacote não encontrado no sistema.");

        var novoItem = new ItemLoja
        {
            Nome = pacote.Nome, 
            Descricao = request.Descricao,
            Tipo = TipoItemLoja.Pacote,
            TipoPacoteId = pacote.Id,
            AlbumId = pacote.AlbumId,
            ImagemUrl = null, // 🚀 Fica NULL! A vitrine vai puxar a cor dinâmica de TipoPacote.Template
            PrecoMoedas = request.PrecoMoedas,
            EstoqueGlobal = request.EstoqueGlobal,
            LimitePorUsuario = request.LimitePorUsuario,
            Ativo = true
        };

        db.ItensLoja.Add(novoItem);
        await db.SaveChangesAsync();

        return Ok(new { mensagem = "Pacote adicionado à loja com sucesso!" });
    }
}