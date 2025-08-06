using CsvHelper;
using QualityControl.Models;
using System.Globalization;

namespace QualityControl.Services
{
    public class CsvProcessingService : ICsvProcessingService
    {
        private static List<Dictionary<string, string>> _cachedData = new();
        private static bool _isDataLoaded = false;

        public async Task<DatasetMetadata> ProcessCsvFileAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty or null.");

            using var reader = new StreamReader(file.OpenReadStream());
            using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);

            await csv.ReadAsync();
            csv.ReadHeader();
            var headers = csv.HeaderRecord;

            if (headers == null || !headers.Contains("Response", StringComparer.OrdinalIgnoreCase))
                throw new InvalidDataException("CSV must contain a 'Response' column.");

            long recordCount = 0;
            long passCount = 0;
            DateTime? firstTimestamp = null;
            DateTime lastTimestamp = DateTime.MinValue;
            bool hasTimestampColumn = headers.Contains("Timestamp", StringComparer.OrdinalIgnoreCase);

            _cachedData.Clear(); // Clear existing cache
            _isDataLoaded = false;

            while (await csv.ReadAsync())
            {
                var record = csv.GetRecord<dynamic>();
                var dict = new Dictionary<string, string>();

                foreach (var header in headers)
                {
                    dict[header] = csv.GetField(header)?.Trim();
                }

                _cachedData.Add(dict);

                recordCount++;

                if (dict.TryGetValue("Response", out var responseVal) && responseVal == "1")
                    passCount++;

                if (hasTimestampColumn && dict.TryGetValue("Timestamp", out var tsVal) &&
                    DateTime.TryParse(tsVal, out DateTime parsed))
                {
                    if (!firstTimestamp.HasValue)
                        firstTimestamp = parsed;

                    lastTimestamp = parsed;
                }
            }

            _isDataLoaded = true;

            var first = hasTimestampColumn && firstTimestamp.HasValue
                ? firstTimestamp.Value
                : new DateTime(2021, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            var last = hasTimestampColumn && firstTimestamp.HasValue
                ? lastTimestamp
                : first.AddSeconds(recordCount > 0 ? recordCount - 1 : 0);

            return new DatasetMetadata
            {
                NumberOfRecords = recordCount,
                NumberOfColumns = headers.Length,
                PassRatePercentage = recordCount > 0 ? Math.Round((double)passCount / recordCount * 100, 2) : 0,
                FirstTimestamp = first.ToString("o"),
                LastTimestamp = last.ToString("o"),
                FileName = file.FileName,
                FileSize = $"{((double)file.Length / (1024 * 1024)):F2} MB"
            };
        }

        public async Task<DateRangeValidationResponse> ValidateDateRangesAsync(DateRanges ranges)
        {
            if (!_isDataLoaded || _cachedData.Count == 0)
                throw new InvalidOperationException("No dataset loaded. Upload a dataset first.");

            int trainCount = 0, testCount = 0, simCount = 0;
            var monthlyDist = new Dictionary<string, int>();

            DateTime trainStart = DateTime.Parse(ranges.TrainStart);
            DateTime trainEnd = DateTime.Parse(ranges.TrainEnd);
            DateTime testStart = DateTime.Parse(ranges.TestStart);
            DateTime testEnd = DateTime.Parse(ranges.TestEnd);
            DateTime simStart = DateTime.Parse(ranges.SimulationStart);
            DateTime simEnd = DateTime.Parse(ranges.SimulationEnd);

            foreach (var record in _cachedData)
            {
                if (!record.TryGetValue("Timestamp", out var tsStr)) continue;
                if (!DateTime.TryParse(tsStr, out DateTime ts)) continue;

                string month = ts.ToString("MMM", CultureInfo.InvariantCulture);
                if (!monthlyDist.ContainsKey(month))
                    monthlyDist[month] = 0;
                monthlyDist[month]++;

                if (ts >= trainStart && ts <= trainEnd) trainCount++;
                else if (ts >= testStart && ts <= testEnd) testCount++;
                else if (ts >= simStart && ts <= simEnd) simCount++;
            }

            int trainDays = (trainEnd - trainStart).Days + 1;
            int testDays = (testEnd - testStart).Days + 1;
            int simDays = (simEnd - simStart).Days + 1;

            return new DateRangeValidationResponse
            {
                Status = "Valid",
                Message = "Date ranges are valid.",
                TrainRecordCount = trainCount,
                TestRecordCount = testCount,
                SimulationRecordCount = simCount,
                TrainDurationDays = trainDays,
                TestDurationDays = testDays,
                SimulationDurationDays = simDays,
                MonthlyDistribution = monthlyDist
            };
        }
    }
}
