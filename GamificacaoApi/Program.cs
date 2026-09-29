using System.Text;
using GamificacaoApi.Auth;
using GamificacaoApi.Common;
using GamificacaoApi.Data;
using GamificacaoApi.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Formato de erro de validacao padronizado - mesmo shape que RegraNegocioException,
// ja combinado com o front: { "mensagem": "...", "codigo": "..." }
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        string mensagem = context.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .FirstOrDefault() ?? "Dados invalidos";

        return new BadRequestObjectResult(new ApiErro(mensagem, "VALIDACAO"));
    };
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default"))
           .UseSnakeCaseNamingConvention());

builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<GamificacaoApi.Albuns.AlbumService>();
builder.Services.AddScoped<GamificacaoApi.Pacote.PacoteService>();
builder.Services.AddScoped<GamificacaoApi.Admin.AlbumAdminService>();
builder.Services.AddScoped<GamificacaoApi.Sintese.SinteseService>();
builder.Services.AddScoped<GamificacaoApi.Inventario.InventarioService>();
builder.Services.AddScoped<GamificacaoApi.Forja.ForjaService>();
builder.Services.AddScoped<GamificacaoApi.MercadoTrocas.MercadoTrocaService>();

var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret nao configurado");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Desliga a traducao automatica de nomes de claim (ex: "sub" vira uma
        // URI legada de WS-Federation por padrao) - mantem os claims exatamente
        // como foram emitidos no token, mais previsivel de ler depois.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            NameClaimType = System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub,
            RoleClaimType = "role"
        };
    });

builder.Services.AddAuthorization(options =>
{
    // Nega por padrao, igual configuramos no Spring - toda rota exige
    // autenticacao a menos que tenha [AllowAnonymous] explicito (como o
    // AuthController).
    options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

// Libera o front (GitHub Pages ou localhost do Vite/CRA em dev) a chamar a API.
// Ajustar a origem real assim que o front tiver dominio definido.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(origin =>
                origin.StartsWith("http://localhost:", StringComparison.OrdinalIgnoreCase) ||
                origin.EndsWith(".github.io", StringComparison.OrdinalIgnoreCase))
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
