namespace GamificacaoApi.MercadoTrocas.Dto;

public record TrocaResponse(
    long Id, 
    long DeUsuarioId, 
    string DeUsuarioNome, 
    long ParaUsuarioId, 
    string ParaUsuarioNome, 
    List<string> Oferece, 
    List<string> Quer, 
    string Status, 
    DateTime Data
);