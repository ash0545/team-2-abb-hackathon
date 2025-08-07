using System.Text.Json.Serialization;

namespace QualityControl.Models;

public class DateRanges
{
    // These will be camelCase from Angular
    public string TrainStart { get; set; } = string.Empty;
    public string TrainEnd { get; set; } = string.Empty;
    public string TestStart { get; set; } = string.Empty;
    public string TestEnd { get; set; } = string.Empty;
    public string SimulationStart { get; set; } = string.Empty;
    public string SimulationEnd { get; set; } = string.Empty;
}

public class DateRangeValidationResponse
{
    public string Status { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}


public class FastApiDateSplitRequest
{
    [JsonPropertyName("train_start_date")]
    public DateTime TrainStartDate { get; set; }
    [JsonPropertyName("train_end_date")]
    public DateTime TrainEndDate { get; set; }
    [JsonPropertyName("test_start_date")]
    public DateTime TestStartDate { get; set; }
    [JsonPropertyName("test_end_date")]
    public DateTime TestEndDate { get; set; }
    [JsonPropertyName("simulation_start_date")]
    public DateTime SimulationStartDate { get; set; }
    [JsonPropertyName("simulation_end_date")]
    public DateTime SimulationEndDate { get; set; }
}

public class FastApiDataSplitResponse
{
    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
    [JsonPropertyName("train_set_rows")]
    public int TrainSetRows { get; set; }
    [JsonPropertyName("test_set_rows")]
    public int TestSetRows { get; set; }
    [JsonPropertyName("simulation_set_rows")]
    public int SimulationSetRows { get; set; }
    [JsonPropertyName("daily_distribution")]
    public Dictionary<string, int> DailyDistribution { get; set; } = new();
}
