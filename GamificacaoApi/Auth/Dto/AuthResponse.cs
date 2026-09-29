namespace GamificacaoApi.Auth.Dto;

public record AuthResponse(string Token, long UsuarioId, string Nome, string Papel);
