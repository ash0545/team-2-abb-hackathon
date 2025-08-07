using System.Text.Json.Serialization;

namespace QualityControl.Models;

// --- DTO for starting the simulation ---
public class SimulationStartResponse
{
    [JsonPropertyName("task_id")]
    public string task_id { get; set; } = string.Empty;
}

// --- DTO for stopping the simulation ---
public class SimulationStopResponse
{
    [JsonPropertyName("task_id")]
    public string task_id { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

// --- DTOs for the main status response from FastAPI ---
public class LivePredictionDataDto
{
    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }

    [JsonPropertyName("sample_id")]
    public string SampleId { get; set; } = string.Empty;

    [JsonPropertyName("prediction")]
    public string Prediction { get; set; } = string.Empty;

    [JsonPropertyName("confidence")]
    public double Confidence { get; set; }

    [JsonPropertyName("top_features")]
    public Dictionary<string, double> TopFeatures { get; set; } = new();
}

public class LiveStatisticsDto
{
    [JsonPropertyName("total_predictions")]
    public int TotalPredictions { get; set; }

    [JsonPropertyName("pass_count")]
    public int PassCount { get; set; }

    [JsonPropertyName("fail_count")]
    public int FailCount { get; set; }

    [JsonPropertyName("average_confidence")]
    public double AverageConfidence { get; set; }
}

// Represents the full data packet in a 'PROGRESS' update
public class SimulationDataPacketDto
{
    [JsonPropertyName("current_row_index")]
    public int CurrentRowIndex { get; set; }

    [JsonPropertyName("total_rows")]
    public int TotalRows { get; set; }

    [JsonPropertyName("quality_score")]
    public double QualityScore { get; set; }

    [JsonPropertyName("live_prediction")]
    public LivePredictionDataDto LivePrediction { get; set; } = new();

    [JsonPropertyName("live_stats")]
    public LiveStatisticsDto LiveStats { get; set; } = new();
}

// Represents the simple status message (e.g., warmup)
public class SimpleStatusProgressDto
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}


// This is the main DTO for the GET /status/{taskId} response from FastAPI/to Angular
public class SimulationStatusResponse
{
    [JsonPropertyName("task_id")]
    public string task_id { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    // 'object?' allows us to pass through the flexible JSON structure (either a 
    // SimulationDataPacket or a SimpleStatusProgress) to the Angular frontend,
    // which is already designed to handle it.
    [JsonPropertyName("progress")]
    public object? Progress { get; set; }

    [JsonPropertyName("result")]
    public object? Result { get; set; }
}
