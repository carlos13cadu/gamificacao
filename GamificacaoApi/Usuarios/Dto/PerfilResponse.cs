namespace GamificacaoApi.Usuarios.Dto;

public record PerfilResponse(
    DateTime MembroDesde,
    int Xp,
    int Level,
    int XpProximoLevel,
    string? AvatarAtivoId, // 🚀 A API agora avisa qual foto está em uso!
    List<AvatarResponse> Avatares,
    List<BadgeResponse> Badges // 🚀 O front-end agora recebe as conquistas!
);

public record AvatarResponse(string Id, string Nome, string ImagemUrl, string CorBorda);

public record BadgeResponse(string Id, string Nome, string Descricao, string Icone, string DesbloqueadoEm);

public record AtualizarAvatarRequest(string FigurinhaId);