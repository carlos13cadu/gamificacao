using System.Text.Json;
using GamificacaoApi.Models;
using Microsoft.EntityFrameworkCore;

namespace GamificacaoApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // Album.Id e normal (gerado pelo banco). Raridade/Figurinha/TipoPacote
    // usam ID string, gerado pelo front.
    public DbSet<Album> Albuns => Set<Album>();
    public DbSet<Raridade> Raridades => Set<Raridade>();
    public DbSet<Figurinha> Figurinhas => Set<Figurinha>();
    public DbSet<TipoPacote> TiposPacote => Set<TipoPacote>();

    // Usuarios e progresso
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<UsuarioInventario> UsuarioInventarios => Set<UsuarioInventario>();
    public DbSet<UsuarioPacote> UsuarioPacotes => Set<UsuarioPacote>();
    public DbSet<PacotesConcedidos> PacotesConcedidos => Set<PacotesConcedidos>();
    public DbSet<MercadoTroca> MercadoTrocas => Set<MercadoTroca>();
    public DbSet<Missao> Missoes => Set<Missao>();
    public DbSet<MissaoProgresso> MissoesProgresso => Set<MissaoProgresso>();

    // 🚀 Novos DbSets de Gamificação
    public DbSet<Insignia> Insignias => Set<Insignia>();
    public DbSet<UsuarioInsignia> UsuarioInsignias => Set<UsuarioInsignia>();

    // Moeda e loja
    public DbSet<MoedaTransacao> MoedaTransacoes => Set<MoedaTransacao>();
    public DbSet<ItemLoja> ItensLoja => Set<ItemLoja>();
    public DbSet<Compra> Compras => Set<Compra>();

    // Competicoes
    public DbSet<Competicao> Competicoes => Set<Competicao>();
    public DbSet<Fase> Fases => Set<Fase>();
    public DbSet<Jogo> Jogos => Set<Jogo>();
    public DbSet<Palpite> Palpites => Set<Palpite>();
    public DbSet<BracketPredicao> BracketPredicoes => Set<BracketPredicao>();

    // Suporte
    public DbSet<ChatMensagem> ChatMensagens => Set<ChatMensagem>();
    public DbSet<LogEntry> Logs => Set<LogEntry>();
    public DbSet<ResetSenhaSolicitacao> ResetSenhaSolicitacoes => Set<ResetSenhaSolicitacao>();

    private static readonly JsonSerializerOptions RegrasDropJsonOptions = new();

    public override int SaveChanges()
    {
        AplicarCarimbosDeTempo();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        AplicarCarimbosDeTempo();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void AplicarCarimbosDeTempo()
    {
        var agora = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Added)
            {
                var criadoEm = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "CriadoEm");
                if (criadoEm is not null) criadoEm.CurrentValue = agora;
            }

            if (entry.State is EntityState.Added or EntityState.Modified)
            {
                var atualizadoEm = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "AtualizadoEm");
                if (atualizadoEm is not null) atualizadoEm.CurrentValue = agora;
            }
        }
    }

    private static string? SerializarPassiva(string? valor)
    {
        if (valor is null) return null;
        try
        {
            using var _ = JsonDocument.Parse(valor);
            return valor; 
        }
        catch (JsonException)
        {
            return JsonSerializer.Serialize(valor); 
        }
    }

    private static string? DesserializarPassiva(string? json)
    {
        if (json is null) return null;
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.ValueKind == JsonValueKind.String
            ? doc.RootElement.GetString()   
            : doc.RootElement.GetRawText(); 
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ---------- Ecossistema Album ----------
        modelBuilder.Entity<Album>(e =>
        {
            e.ToTable("albuns");
            e.HasOne(a => a.SubAlbum).WithMany()
                .HasForeignKey(a => a.SubAlbumId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Raridade>(e =>
        {
            e.ToTable("raridades");
            e.Property(r => r.Id).ValueGeneratedNever();
            e.HasOne(r => r.Album).WithMany(a => a.Raridades)
                .HasForeignKey(r => r.AlbumId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Figurinha>(e =>
        {
            e.ToTable("figurinhas");
            e.Property(f => f.Id).ValueGeneratedNever();
            e.Property(f => f.Passiva)
                .HasConversion(
                    valor => SerializarPassiva(valor),
                    json => DesserializarPassiva(json))
                .HasColumnType("jsonb");
            e.HasOne(f => f.Album).WithMany(a => a.Figurinhas)
                .HasForeignKey(f => f.AlbumId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(f => f.Raridade).WithMany()
                .HasForeignKey(f => f.RaridadeId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TipoPacote>(e =>
        {
            e.ToTable("tipos_pacote");
            e.Property(t => t.Id).ValueGeneratedNever();
            e.Property(t => t.RegrasDrop)
                .HasConversion(
                    regras => JsonSerializer.Serialize(regras, RegrasDropJsonOptions),
                    json => JsonSerializer.Deserialize<RegrasDrop>(json, RegrasDropJsonOptions)!)
                .HasColumnType("jsonb");
            e.HasOne(t => t.Album).WithMany(a => a.TiposPacote)
                .HasForeignKey(t => t.AlbumId).OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- Usuarios ----------

        modelBuilder.Entity<Usuario>(e =>
        {
            e.ToTable("usuarios");
            e.Property(u => u.Papel).HasConversion<string>();
            e.HasIndex(u => u.Nome).IsUnique();

            // 🚀 Mapeamento explícito das novas colunas da Gamificação
            e.Property(u => u.Xp).HasDefaultValue(0);
            e.Property(u => u.Level).HasDefaultValue(1);
            
            // Relacionamento com a Figurinha (Avatar)
            e.HasOne(u => u.AvatarFigurinha)
                .WithMany()
                .HasForeignKey(u => u.AvatarFigurinhaId)
                .OnDelete(DeleteBehavior.SetNull); // Se a figurinha for deletada, o avatar volta pro padrao (null)
        });

        modelBuilder.Entity<UsuarioInventario>(e =>
        {
            e.ToTable("usuario_inventario");
            e.HasIndex(i => new { i.UsuarioId, i.FigurinhaId }).IsUnique();
            e.HasOne(i => i.Usuario).WithMany()
                .HasForeignKey(i => i.UsuarioId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(i => i.Figurinha).WithMany()
                .HasForeignKey(i => i.FigurinhaId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UsuarioPacote>(e =>
        {
            e.ToTable("usuario_pacotes");
            e.HasIndex(p => new { p.UsuarioId, p.TipoPacoteId }).IsUnique();
            e.HasOne(p => p.Usuario).WithMany()
                .HasForeignKey(p => p.UsuarioId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.TipoPacote).WithMany()
                .HasForeignKey(p => p.TipoPacoteId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PacotesConcedidos>(e =>
        {
            e.ToTable("pacotes_concedidos");
            e.HasOne(p => p.Usuario).WithMany()
                .HasForeignKey(p => p.UsuarioId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.TipoPacote).WithMany()
                .HasForeignKey(p => p.TipoPacoteId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MercadoTroca>(e =>
        {
            e.ToTable("mercado_trocas");
            e.Property(m => m.Status).HasConversion<string>();
            e.HasOne(m => m.DeUsuario).WithMany()
                .HasForeignKey(m => m.DeUsuarioId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(m => m.ParaUsuario).WithMany()
                .HasForeignKey(m => m.ParaUsuarioId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Missao>(e =>
        {
            e.ToTable("missoes");
            e.Property(m => m.Periodicidade).HasConversion<string>();
            e.HasOne(m => m.Album).WithMany()
                .HasForeignKey(m => m.AlbumId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(m => m.RecompensaTipoPacote).WithMany()
                .HasForeignKey(m => m.RecompensaTipoPacoteId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MissaoProgresso>(e =>
        {
            e.ToTable("missoes_progresso");
            e.HasIndex(p => new { p.UsuarioId, p.MissaoId, p.PeriodoRef }).IsUnique();
            e.HasOne(p => p.Usuario).WithMany()
                .HasForeignKey(p => p.UsuarioId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.Missao).WithMany()
                .HasForeignKey(p => p.MissaoId).OnDelete(DeleteBehavior.Restrict);
        });

        // 🚀 ---------- Insignias e Gamificação ----------

        modelBuilder.Entity<Insignia>(e =>
        {
            e.ToTable("insignias");
        });

        modelBuilder.Entity<UsuarioInsignia>(e =>
        {
            e.ToTable("usuario_insignias");
            
            // Chave primária composta (Um usuário só pode ter a mesma insígnia uma vez)
            e.HasKey(ui => new { ui.UsuarioId, ui.InsigniaId });
            
            e.HasOne(ui => ui.Usuario).WithMany()
                .HasForeignKey(ui => ui.UsuarioId).OnDelete(DeleteBehavior.Restrict);
                
            e.HasOne(ui => ui.Insignia).WithMany(i => i.UsuariosInsignias)
                .HasForeignKey(ui => ui.InsigniaId).OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- Moeda e loja ----------

        modelBuilder.Entity<MoedaTransacao>(e =>
        {
            e.ToTable("moeda_transacoes");
            e.Property(m => m.Tipo).HasConversion<string>();
            e.HasOne(m => m.Usuario).WithMany()
                .HasForeignKey(m => m.UsuarioId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ItemLoja>(e =>
        {
            e.ToTable("itens_loja");
            e.Property(i => i.Tipo).HasConversion<string>();
            e.HasOne(i => i.Figurinha).WithMany()
                .HasForeignKey(i => i.FigurinhaId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(i => i.Album).WithMany()
                .HasForeignKey(i => i.AlbumId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Compra>(e =>
        {
            e.ToTable("compras");
            e.HasOne(c => c.Usuario).WithMany()
                .HasForeignKey(c => c.UsuarioId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(c => c.ItemLoja).WithMany()
                .HasForeignKey(c => c.ItemLojaId).OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- Competicoes ----------

        modelBuilder.Entity<Competicao>(e =>
        {
            e.ToTable("competicoes");
            e.Property(c => c.Status).HasConversion<string>();
            e.Property(c => c.RegrasPontuacao).HasColumnType("jsonb");
        });

        modelBuilder.Entity<Fase>(e =>
        {
            e.ToTable("fases");
            e.Property(f => f.Formato).HasConversion<string>();
            e.HasOne(f => f.Competicao).WithMany()
                .HasForeignKey(f => f.CompeticaoId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Jogo>(e =>
        {
            e.ToTable("jogos");
            e.Property(j => j.Status).HasConversion<string>();
            e.HasOne(j => j.Fase).WithMany()
                .HasForeignKey(j => j.FaseId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Palpite>(e =>
        {
            e.ToTable("palpites");
            e.HasIndex(p => new { p.UsuarioId, p.JogoId }).IsUnique();
            e.HasOne(p => p.Usuario).WithMany()
                .HasForeignKey(p => p.UsuarioId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.Jogo).WithMany()
                .HasForeignKey(p => p.JogoId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BracketPredicao>(e =>
        {
            e.ToTable("bracket_predicoes");
            e.Property(b => b.Payload).HasColumnType("jsonb");
            e.Property(b => b.PremiosResgatados).HasColumnType("jsonb");
            e.HasIndex(b => new { b.UsuarioId, b.CompeticaoId }).IsUnique();
            e.HasOne(b => b.Usuario).WithMany()
                .HasForeignKey(b => b.UsuarioId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(b => b.Competicao).WithMany()
                .HasForeignKey(b => b.CompeticaoId).OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- Suporte ----------

        modelBuilder.Entity<ChatMensagem>(e =>
        {
            e.ToTable("chat_mensagens");
            e.HasOne(c => c.Usuario).WithMany()
                .HasForeignKey(c => c.UsuarioId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LogEntry>(e =>
        {
            e.ToTable("logs");
            e.HasOne(l => l.Usuario).WithMany()
                .HasForeignKey(l => l.UsuarioId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ResetSenhaSolicitacao>(e =>
        {
            e.ToTable("reset_senha_solicitacoes");
            e.Property(r => r.Status).HasConversion<string>();
            e.HasOne(r => r.Usuario).WithMany()
                .HasForeignKey(r => r.UsuarioId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}