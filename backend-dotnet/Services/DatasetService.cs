using QualityControl.Models;
using System.Globalization;

namespace QualityControl.Services;

public interface IDatasetService
{
    Task<DateRangeValidationResponse> ValidateDateRangesAsync(DateRanges ranges);
    Task<FastApiDataSplitResponse?> SplitDataAsync(DateRanges ranges);
}

public class DatasetService : IDatasetService
{
    private readonly IMetadataService _metadataService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<DatasetService> _logger;

    public DatasetService(IMetadataService metadataService, IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<DatasetService> logger)
    {
        _metadataService = metadataService;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<DateRangeValidationResponse> ValidateDateRangesAsync(DateRanges ranges)
    {
        var metadata = await _metadataService.GetMetadataAsync();
        if (metadata == null)
            return new DateRangeValidationResponse { Status = "Invalid", Message = "Dataset metadata not found. Please upload a dataset first." };

        // ❗ PARSE YYYY-MM-DD STRINGS
        // Use a helper to provide specific errors if parsing fails.
        if (!DateTime.TryParse(ranges.TrainStart, out var trainStart)) return new DateRangeValidationResponse { Status = "Invalid", Message = "Training Start Date is invalid." };
        if (!DateTime.TryParse(ranges.TrainEnd, out var trainEnd)) return new DateRangeValidationResponse { Status = "Invalid", Message = "Training End Date is invalid." };
        if (!DateTime.TryParse(ranges.TestStart, out var testStart)) return new DateRangeValidationResponse { Status = "Invalid", Message = "Testing Start Date is invalid." };
        if (!DateTime.TryParse(ranges.TestEnd, out var testEnd)) return new DateRangeValidationResponse { Status = "Invalid", Message = "Testing End Date is invalid." };
        if (!DateTime.TryParse(ranges.SimulationStart, out var simStart)) return new DateRangeValidationResponse { Status = "Invalid", Message = "Simulation Start Date is invalid." };
        if (!DateTime.TryParse(ranges.SimulationEnd, out var simEnd)) return new DateRangeValidationResponse { Status = "Invalid", Message = "Simulation End Date is invalid." };

        var overallStart = DateTime.Parse(metadata.FirstTimestamp, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal);
        var overallEnd = DateTime.Parse(metadata.LastTimestamp, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal);

        // ❗ PROVIDE SPECIFIC VALIDATION MESSAGES
        // Rule 1: End date must be >= start date
        if (trainStart.Date > trainEnd.Date) return new DateRangeValidationResponse { Status = "Invalid", Message = $"Training End Date ({trainEnd:yyyy-MM-dd}) must be on or after its Start Date ({trainStart:yyyy-MM-dd})." };
        if (testStart.Date > testEnd.Date) return new DateRangeValidationResponse { Status = "Invalid", Message = $"Testing End Date ({testEnd:yyyy-MM-dd}) must be on or after its Start Date ({testStart:yyyy-MM-dd})." };
        if (simStart.Date > simEnd.Date) return new DateRangeValidationResponse { Status = "Invalid", Message = $"Simulation End Date ({simEnd:yyyy-MM-dd}) must be on or after its Start Date ({simStart:yyyy-MM-dd})." };

        // Rule 2: Periods must be sequential
        if (testStart.Date <= trainEnd.Date) return new DateRangeValidationResponse { Status = "Invalid", Message = $"Testing Start Date ({testStart:yyyy-MM-dd}) must be after the Training End Date ({trainEnd:yyyy-MM-dd})." };
        if (simStart.Date <= testEnd.Date) return new DateRangeValidationResponse { Status = "Invalid", Message = $"Simulation Start Date ({simStart:yyyy-MM-dd}) must be after the Testing End Date ({testEnd:yyyy-MM-dd})." };

        // Rule 3: Dates must be within the dataset's available range
        if (trainStart.Date < overallStart.Date) return new DateRangeValidationResponse { Status = "Invalid", Message = $"Training Start Date ({trainStart:yyyy-MM-dd}) is before the dataset's first day ({overallStart:yyyy-MM-dd})." };
        if (simEnd.Date > overallEnd.Date) return new DateRangeValidationResponse { Status = "Invalid", Message = $"Simulation End Date ({simEnd:yyyy-MM-dd}) is after the dataset's last day ({overallEnd:yyyy-MM-dd})." };

        return new DateRangeValidationResponse { Status = "Valid", Message = "Date ranges are valid and sequential." };
    }

    public async Task<FastApiDataSplitResponse?> SplitDataAsync(DateRanges ranges)
    {
        // This method also needs to parse the simple date strings
        if (!DateTime.TryParse(ranges.TrainStart, out var trainStart) ||
            !DateTime.TryParse(ranges.TrainEnd, out var trainEnd) ||
            !DateTime.TryParse(ranges.TestStart, out var testStart) ||
            !DateTime.TryParse(ranges.TestEnd, out var testEnd) ||
            !DateTime.TryParse(ranges.SimulationStart, out var simStart) ||
            !DateTime.TryParse(ranges.SimulationEnd, out var simEnd))
        {
            _logger.LogError("SplitDataAsync received invalid date formats from client, even after validation.");
            return null; // Should not happen if validation passed
        }

        var requestDto = new FastApiDateSplitRequest
        {
            // Set time to start of day, then convert to UTC for the Python service
            TrainStartDate = DateTime.SpecifyKind(trainStart.Date, DateTimeKind.Utc),
            // Set time to end of day, then convert to UTC
            TestStartDate = DateTime.SpecifyKind(testStart.Date, DateTimeKind.Utc),
            SimulationStartDate = DateTime.SpecifyKind(simStart.Date, DateTimeKind.Utc),
            TrainEndDate = DateTime.SpecifyKind(trainEnd.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc),
            TestEndDate = DateTime.SpecifyKind(testEnd.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc),
            SimulationEndDate = DateTime.SpecifyKind(simEnd.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
        };

        var client = _httpClientFactory.CreateClient("PythonApiClient");
        var endpoint = "http://ml-service:8000/process/split-data";
        var response = await client.PostAsJsonAsync(endpoint, requestDto);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            _logger.LogError("FastAPI split-data endpoint returned an error: {StatusCode} - {Content}", response.StatusCode, errorContent);
            return null;
        }

        return await response.Content.ReadFromJsonAsync<FastApiDataSplitResponse>();
    }
}
