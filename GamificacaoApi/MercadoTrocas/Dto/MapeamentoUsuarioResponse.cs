namespace GamificacaoApi.MercadoTrocas.Dto;

public record MapeamentoUsuarioResponse(
    long UsuarioId, 
    string Nome, 
    bool TemRepetida, 
    bool TemUtilPraMim
);