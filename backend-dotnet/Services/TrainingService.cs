using System.Text.Json;
using QualityControl.Models;

namespace QualityControl.Services;

public interface ITrainingService
{
    Task<TrainingStartResponse?> StartTrainingAsync();
    Task<TrainingStatusFromFastApi?> GetTrainingStatusAsync(string task_id);
}

public class TrainingService : ITrainingService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<TrainingService> _logger;

    public TrainingService(IHttpClientFactory httpClientFactory, ILogger<TrainingService> logger)
    {
        _httpClient = httpClientFactory.CreateClient("FastApiClient");
        _logger = logger;
    }

    public async Task<TrainingStartResponse?> StartTrainingAsync()
    {
        try
        {
            var response = await _httpClient.PostAsync("process/train/start", null);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<TrainingStartResponse>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            _logger.LogInformation("Successfully started training task with ID: {task_id}", result?.task_id);
            return result;
        }
        catch (HttpRequestException e)
        {
            _logger.LogError(e, "Error calling FastAPI to start training.");
            throw;
        }
    }

    public async Task<TrainingStatusFromFastApi?> GetTrainingStatusAsync(string task_id)
    {
        try
        {
            var response = await _httpClient.GetAsync($"process/train/status/{task_id}");
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<TrainingStatusFromFastApi>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return result;
        }
        catch (HttpRequestException e)
        {
            _logger.LogError(e, "Error calling FastAPI to get status for task ID {task_id}", task_id);
            throw;
        }
    }
}
