using System.Text.Json;
using QualityControl.Models;

namespace QualityControl.Services;

public interface ISimulationService
{
    Task<SimulationStartResponse?> StartSimulationAsync();
    Task StopSimulationAsync(string task_id);
    Task<SimulationStatusResponse?> GetSimulationStatusAsync(string task_id);
}

public class SimulationService : ISimulationService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<SimulationService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public SimulationService(IHttpClientFactory httpClientFactory, ILogger<SimulationService> logger)
    {
        _httpClient = httpClientFactory.CreateClient("FastApiClient");
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
    }

    public async Task<SimulationStartResponse?> StartSimulationAsync()
    {
        _logger.LogInformation("Sending request to FastAPI to start simulation.");
        var response = await _httpClient.PostAsync("simulation/start", null);
        response.EnsureSuccessStatusCode();

        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<SimulationStartResponse>(responseContent, _jsonOptions);
        return result;
    }

    public async Task StopSimulationAsync(string task_id)
    {
        _logger.LogInformation("Sending request to FastAPI to stop simulation task {task_id}.", task_id);
        var response = await _httpClient.PostAsync($"simulation/stop/{task_id}", null);
        response.EnsureSuccessStatusCode();
    }

    public async Task<SimulationStatusResponse?> GetSimulationStatusAsync(string task_id)
    {
        // No need for excessive logging here as it will be called every 500ms.
        var response = await _httpClient.GetAsync($"simulation/status/{task_id}");
        response.EnsureSuccessStatusCode();

        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<SimulationStatusResponse>(responseContent, _jsonOptions);

        return result;
    }
}
