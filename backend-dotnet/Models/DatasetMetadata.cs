namespace QualityControl.Models
{
    public class DatasetMetadata
    {
        public long NumberOfRecords { get; set; }
        public int NumberOfColumns { get; set; }
        public double PassRatePercentage { get; set; }
        public string FirstTimestamp { get; set; } = string.Empty;
        public string LastTimestamp { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string FileSize { get; set; } = string.Empty;
    }
}
