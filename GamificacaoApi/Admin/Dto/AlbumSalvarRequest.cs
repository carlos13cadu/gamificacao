using System.Text.Json.Serialization;

namespace GamificacaoApi.Admin.Dto;

// Espelha EXATAMENTE o contrato TypeScript confirmado pelo front (Album,
// Rarity, Pack, StickerDef). Qualquer campo novo que o front adicionar
// depois e so adicionar aqui - o resto da logica (AlbumAdminService) nao
// precisa mudar.
//
// SEM campo "Id" aqui de proposito: o id do album e gerado pelo banco.
// No POST (criar) nao existe ainda; no PUT (atualizar) ele vem da URL, nao
// do corpo.

public record BonusTierRequest(
    [property: JsonPropertyName("chance")] decimal Chance,
    [property: JsonPropertyName("amount")] int Amount
);

public record RaridadeSalvarRequest(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("color")] string? Color,
    [property: JsonPropertyName("weight")] int Weight
);

public record PacoteSalvarRequest(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("template")] string? Template,
    [property: JsonPropertyName("amount")] int Amount,
    [property: JsonPropertyName("behavior")] string Behavior,
    [property: JsonPropertyName("bonusTiers")] List<BonusTierRequest>? BonusTiers,
    [property: JsonPropertyName("drops")] Dictionary<string, decimal> Drops
);

public record FigurinhaSalvarRequest(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("rarityId")] string RarityId,
    [property: JsonPropertyName("image")] string? Image,
    [property: JsonPropertyName("isSecret")] bool IsSecret,
    [property: JsonPropertyName("passiveDesc")] string? PassiveDesc,
    [property: JsonPropertyName("passiveRule")] string? PassiveRule,
    [property: JsonPropertyName("isTrophy")] bool? IsTrophy
);

public record AlbumSalvarRequest(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("desc")] string? Desc,
    [property: JsonPropertyName("total")] int? Total,
    [property: JsonPropertyName("isPrincipal")] bool IsPrincipal,
    [property: JsonPropertyName("permiteGameplay")] bool PermiteGameplay,
    [property: JsonPropertyName("isFinalized")] bool IsFinalized,
    [property: JsonPropertyName("subAlbumId")] long? SubAlbumId,
    [property: JsonPropertyName("rarities")] List<RaridadeSalvarRequest> Rarities,
    [property: JsonPropertyName("packs")] List<PacoteSalvarRequest> Packs,
    [property: JsonPropertyName("stickers")] List<FigurinhaSalvarRequest> Stickers
);
