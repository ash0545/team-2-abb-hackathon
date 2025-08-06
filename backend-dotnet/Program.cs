// Entry point for the .NET Web API. Configures services, CORS, and routing.

using QualityControl.Services;
using Microsoft.AspNetCore.Http.Features;

var builder = WebApplication.CreateBuilder(args);

// Set 2 GB limit for form options
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 2L * 1024 * 1024 * 1024; // 2 GB
});

// Also apply it for Kestrel directly (required for large requests)
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 2L * 1024 * 1024 * 1024; // 2 GB
});

// --- Service Configuration ---
// Add controllers to the service container.
builder.Services.AddControllers();

// Register the CsvProcessingService for dependency injection.
builder.Services.AddScoped<ICsvProcessingService, CsvProcessingService>();

// --- NEW: Register Training Service and HttpClientFactory ---
builder.Services.AddScoped<ITrainingService, TrainingService>();
builder.Services.AddHttpClient("FastApiClient", client =>
{
    var fastApiUrl = builder.Configuration.GetValue<string>("FastApiService:BaseUrl");
    if (string.IsNullOrEmpty(fastApiUrl))
    {
        throw new InvalidOperationException("FastAPI service base URL is not configured in appsettings.json");
    }
    client.BaseAddress = new Uri(fastApiUrl);
});

// Configure CORS (Cross-Origin Resource Sharing) to allow requests
// from the Angular development server.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200", "http://0.0.0.0:4200") // Add your Angular app's origin(s)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Add services for API documentation (Swagger/OpenAPI).
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// --- Middleware Pipeline ---
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection(); // Disabled for local dev container setup

// Enable the configured CORS policy.
app.UseCors("AllowAngularApp");

app.UseAuthorization();

// Map incoming requests to controller actions.
app.MapControllers();

app.Run();
