namespace QualityControl.Models
{
    public class DateRangeValidationResponse
    {
        public string Status { get; set; }
        public string Message { get; set; }

        public int TrainRecordCount { get; set; }
        public int TestRecordCount { get; set; }
        public int SimulationRecordCount { get; set; }

        public int TrainDurationDays { get; set; }
        public int TestDurationDays { get; set; }
        public int SimulationDurationDays { get; set; }

        public Dictionary<string, int> MonthlyDistribution { get; set; }
    }
}
