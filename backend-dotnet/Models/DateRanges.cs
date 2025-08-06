using CsvProcessor.Models;

namespace CsvProcessor.Models
{
    public class DateRanges
    {
        public string TrainStart { get; set; }
        public string TrainEnd { get; set; }
        public string TestStart { get; set; }
        public string TestEnd { get; set; }
        public string SimulationStart { get; set; }
        public string SimulationEnd { get; set; }
    }
}
