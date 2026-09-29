using System.Net;
using GamificacaoApi.Common;
using GamificacaoApi.Data;
using GamificacaoApi.Models;
using GamificacaoApi.Pacote.Dto;
using GamificacaoApi.Inventario.Dto;
using Microsoft.EntityFrameworkCore;

namespace GamificacaoApi.Inventario;

public class InventarioService(AppDbContext db)
{
    public async Task<UsarCoringaResponse> UsarCoringaAsync(long usuarioId, UsarCoringaRequest request)
    {
        // 1. Acha a figurinha alvo desejada
        var alvo = await db.Figurinhas
            .Include(f => f.Raridade)
            .FirstOrDefaultAsync(f => f.Id == request.TargetStickerId)
            ?? throw new RegraNegocioException("ALVO_NAO_ENCONTRADO", "A figurinha desejada não existe.", HttpStatusCode.NotFound);

        // 2. Trava de Segurança: Não permite usar o Coringa para pegar Troféus ou outras Secretas (Peso >= 100)
        if (alvo.IsTrofeu || alvo.Raridade?.Peso >= 100 || alvo.Nome.Contains("Coringa"))
        {
            throw new RegraNegocioException(
                "ALVO_INVALIDO", 
                "O Coringa só pode ser trocado por figurinhas Comuns ou Raras. Ele não cria Secretas ou Troféus.", 
                HttpStatusCode.BadRequest);
        }

        // 3. Busca a figurinha "Coringa" genérica do banco (usando o nome)
        var coringa = await db.Figurinhas
            .FirstOrDefaultAsync(f => f.Nome.Contains("Coringa"))
            ?? throw new RegraNegocioException("CORINGA_NAO_CONFIGURADO", "Figurinha Coringa não encontrada no sistema.", HttpStatusCode.InternalServerError);

        // 4. Verifica se o usuário de fato POSSUI o Coringa no inventário
        var inventarioCoringa = await db.UsuarioInventarios
            .FirstOrDefaultAsync(i => i.UsuarioId == usuarioId && i.FigurinhaId == coringa.Id);

        if (inventarioCoringa is null || inventarioCoringa.Quantidade <= 0)
        {
            throw new RegraNegocioException("SEM_CORINGA", "Você não possui nenhuma figurinha Coringa para usar.", HttpStatusCode.BadRequest);
        }

        // 5. Executa a troca de forma atômica (Transação)
        await using var transacao = await db.Database.BeginTransactionAsync();

        // Debita 1 Coringa
        inventarioCoringa.Quantidade -= 1;

        // Credita a figurinha Alvo
        var inventarioAlvo = await db.UsuarioInventarios
            .FirstOrDefaultAsync(i => i.UsuarioId == usuarioId && i.FigurinhaId == alvo.Id);

        if (inventarioAlvo is null)
        {
            inventarioAlvo = new UsuarioInventario { UsuarioId = usuarioId, FigurinhaId = alvo.Id, Quantidade = 0 };
            db.UsuarioInventarios.Add(inventarioAlvo);
        }
        inventarioAlvo.Quantidade += 1;

        await db.SaveChangesAsync();
        await transacao.CommitAsync();

        // 6. Prepara o retorno visual para a chuva de confetes no React!
        var result = new FigurinhaSorteadaResponse(
            alvo.Id, 
            alvo.Nome, 
            alvo.ImagemUrl, 
            alvo.RaridadeId, 
            alvo.Raridade?.Nome ?? "Normal"
        );

        return new UsarCoringaResponse("success", new List<FigurinhaSorteadaResponse> { result });
    }
}