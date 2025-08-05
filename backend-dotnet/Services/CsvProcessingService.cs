using CsvHelper;
using CsvProcessor.Models;
using System.Globalization;

namespace CsvProcessor.Services
{
    public class CsvProcessingService : ICsvProcessingService
    {
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

            while (await csv.ReadAsync())
            {
                var record = csv.GetRecord<dynamic>();
                var recordDict = (IDictionary<string, object>)record;

                recordCount++;

                if (recordDict.TryGetValue("Response", out var responseVal) && responseVal?.ToString() == "1")
                    passCount++;

                if (hasTimestampColumn && recordDict.TryGetValue("Timestamp", out var tsVal))
                {
                    if (DateTime.TryParse(tsVal?.ToString(), out DateTime parsed))
                    {
                        if (!firstTimestamp.HasValue)
                            firstTimestamp = parsed;

                        lastTimestamp = parsed;
                    }
                }
            }

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
    }
}
