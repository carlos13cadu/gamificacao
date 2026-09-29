namespace GamificacaoApi.MercadoTrocas.Dto;

public record NovaTrocaRequest(
    long ParaUsuarioId, 
    long AlbumId, 
    List<string> OfereceIds, 
    List<string> QuerIds
);