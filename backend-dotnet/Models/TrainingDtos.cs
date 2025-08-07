using System.Text.Json.Serialization;

namespace QualityControl.Models;

// --- DTO for the response from POST /api/training/start ---
public class TrainingStartResponse
{
    [JsonPropertyName("task_id")]
    public string task_id { get; set; } = string.Empty;
}

// --- DTOs that map to the FastAPI /status/{task_id} response ---

// This corresponds to the FastAPI 'TrainingResult' model
public class TrainingResultDto
{
    [JsonPropertyName("metrics")]
    public MetricsDto Metrics { get; set; } = new();

    [JsonPropertyName("training_chart")]
    public TrainingChartDto TrainingChart { get; set; } = new();

    [JsonPropertyName("confusion_matrix")]
    public ConfusionMatrixDto ConfusionMatrix { get; set; } = new();

    [JsonPropertyName("model_path")]
    public string ModelPath { get; set; } = string.Empty;

    [JsonPropertyName("curves_path")]
    public string CurvesPath { get; set; } = string.Empty;
}

public class MetricsDto
{
    [JsonPropertyName("accuracy")]
    public double Accuracy { get; set; }

    [JsonPropertyName("precision")]
    public double Precision { get; set; }

    [JsonPropertyName("recall")]
    public double Recall { get; set; }

    [JsonPropertyName("f1_score")]
    public double F1Score { get; set; }
}

public class TrainingChartDto
{
    [JsonPropertyName("train_loss")]
    public List<ChartDataPointDto> TrainLoss { get; set; } = new();

    [JsonPropertyName("train_accuracy")]
    public List<ChartDataPointDto> TrainAccuracy { get; set; } = new();
}

public class ChartDataPointDto
{
    [JsonPropertyName("x")]
    public int X { get; set; }

    [JsonPropertyName("y")]
    public double Y { get; set; }
}

public class ConfusionMatrixDto
{
    [JsonPropertyName("true_positives")]
    public int TruePositives { get; set; }

    [JsonPropertyName("false_positives")]
    public int FalsePositives { get; set; }

    [JsonPropertyName("true_negatives")]
    public int TrueNegatives { get; set; }

    [JsonPropertyName("false_negatives")]
    public int FalseNegatives { get; set; }
}

// Corresponds to the simple progress update from FastAPI
public class TrainingProgressDto
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}

// This is the main DTO for the GET /status/{task_id} response from FastAPI
// Note: 'Progress' is a JsonElement because it can be one of two different object types.
// We will deserialize it based on content later.
public class TrainingStatusFromFastApi
{
    [JsonPropertyName("task_id")]
    public string task_id { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("progress")]
    public object? Progress { get; set; }

    [JsonPropertyName("result")]
    public TrainingResultDto? Result { get; set; }
}
