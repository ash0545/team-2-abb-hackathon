using QualityControl.Models;
using System.Text;
using System.Net.Http.Headers;
using System.Net;
namespace QualityControl.Services;

public class CsvProcessingService : ICsvProcessingService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<CsvProcessingService> _logger;
    private readonly IMetadataService _metadataService;
    private readonly IConfiguration _configuration;
    private readonly string _tempFileDirectory;

    public CsvProcessingService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<CsvProcessingService> logger,
        IMetadataService metadataService)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _metadataService = metadataService;
        _configuration = configuration;
        _tempFileDirectory = Path.Combine(Directory.GetCurrentDirectory(), "storage", "temp");
        Directory.CreateDirectory(_tempFileDirectory);
    }

    private string GetTempFilePath() => Path.Combine(_tempFileDirectory, $"{Guid.NewGuid()}.tmp");

    public async Task<DatasetMetadata> ProcessAndForwardCsvAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty or null.");

        var tempFilePath = GetTempFilePath();
        _logger.LogInformation("Starting CSV processing. Temp file: {TempPath}", tempFilePath);

        try
        {
            var metadata = await ProcessAndWriteToTempFileAsync(file, tempFilePath);

            _logger.LogInformation(
                "Metadata calculated: Records={Records}, Columns={Cols}, PassRate={PassRate}%, Range={Start} to {End}",
                metadata.NumberOfRecords, metadata.NumberOfColumns, metadata.PassRatePercentage,
                metadata.FirstTimestamp, metadata.LastTimestamp
            );

            await ForwardTempFileToPythonServiceAsync(file.FileName, tempFilePath);

            await _metadataService.SaveMetadataAsync(metadata);

            return metadata;
        }
        finally
        {
            if (File.Exists(tempFilePath))
            {
                File.Delete(tempFilePath);
                _logger.LogInformation("Deleted temporary file: {TempPath}", tempFilePath);
            }
        }
    }

    private async Task<DatasetMetadata> ProcessAndWriteToTempFileAsync(IFormFile file, string tempFilePath)
    {
        long recordCount = 0;
        long zeroResponseCount = 0;
        int responseColumnIndex = -1;
        string[] headers = Array.Empty<string>();
        var startDate = DateTime.UtcNow;
        var firstTimestamp = startDate;
        var lastTimestamp = startDate;

        await using var readStream = file.OpenReadStream();
        using var reader = new StreamReader(readStream);
        await using var writer = new StreamWriter(tempFilePath, false, Encoding.UTF8);

        var headerLine = await reader.ReadLineAsync() ?? throw new InvalidDataException("CSV is empty.");
        headers = headerLine.Split(',');
        responseColumnIndex = Array.FindIndex(headers, h => h.Trim().Equals("Response", StringComparison.OrdinalIgnoreCase));
        if (responseColumnIndex == -1) throw new InvalidDataException("CSV must contain a 'Response' column.");

        await writer.WriteLineAsync($"synthetic_timestamp,{headerLine}");

        string? line;
        while ((line = await reader.ReadLineAsync()) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;
            recordCount++;
            var currentTimestamp = startDate.AddSeconds(recordCount - 1);
            await writer.WriteLineAsync($"{currentTimestamp:yyyy-MM-dd HH:mm:ss},{line}");
            var values = line.Split(',');
            if (values.Length > responseColumnIndex && values[responseColumnIndex].Trim() == "0")
            {
                zeroResponseCount++;
            }
        }

        lastTimestamp = startDate.AddSeconds(recordCount > 0 ? recordCount - 1 : 0);
        _logger.LogInformation("Finished processing {RecordCount} records to temporary file.", recordCount);

        return new DatasetMetadata
        {
            NumberOfRecords = recordCount,
            NumberOfColumns = headers.Length + 1,
            PassRatePercentage = recordCount > 0 ? Math.Round((double)zeroResponseCount / recordCount * 100, 2) : 0,
            FirstTimestamp = firstTimestamp.ToString("o"),
            LastTimestamp = lastTimestamp.ToString("o"),
            FileName = file.FileName,
            FileSize = $"{((double)file.Length / (1024 * 1024)):F2} MB"
        };
    }

    private async Task ForwardTempFileToPythonServiceAsync(string fileName, string tempFilePath)
    {
        var pythonServiceUrl = $"{_configuration["PythonService:BaseUrl"]}{_configuration["PythonService:DatasetStoreEndpoint"]}";

        var client = _httpClientFactory.CreateClient("PythonApiClient");

        // Ensure client timeout is set (this should be configured in DI, but double-check)
        if (client.Timeout == TimeSpan.FromSeconds(100))
        {
            _logger.LogWarning("HttpClient timeout is still 100 seconds, overriding to 30 minutes");
            client.Timeout = TimeSpan.FromMinutes(30);
        }

        var fileInfo = new FileInfo(tempFilePath);
        var totalBytes = fileInfo.Length;

        _logger.LogInformation("Starting upload of {FileName} ({SizeMB:F2} MB) to Python service...",
            fileName, totalBytes / (1024.0 * 1024.0));

        try
        {
            // Create progress tracking content
            using var fileStream = new FileStream(tempFilePath, FileMode.Open, FileAccess.Read);
            using var progressContent = new ProgressStreamContent(fileStream, totalBytes, progress =>
            {
                _logger.LogInformation("Upload progress: {Progress:F1}% ({BytesSent:F2}MB / {TotalMB:F2}MB)",
                    progress.Percentage,
                    progress.BytesSent / (1024.0 * 1024.0),
                    progress.TotalBytes / (1024.0 * 1024.0));
            });

            using var multipartContent = new MultipartFormDataContent();

            // Set proper headers
            progressContent.Headers.ContentType = MediaTypeHeaderValue.Parse("text/csv");
            progressContent.Headers.ContentDisposition = new ContentDispositionHeaderValue("form-data")
            {
                Name = "\"file\"",
                FileName = $"\"{fileName}\""
            };

            multipartContent.Add(progressContent);

            // Send with progress tracking
            var response = await client.PostAsync(pythonServiceUrl, multipartContent);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("FastAPI service returned error: {StatusCode} - {Content}",
                    response.StatusCode, errorContent);
                throw new HttpRequestException($"FastAPI service returned {response.StatusCode}: {errorContent}");
            }

            _logger.LogInformation("Successfully uploaded {FileName} to Python service", fileName);
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
        {
            _logger.LogError("Upload timed out after {Timeout} minutes", client.Timeout.TotalMinutes);
            throw new HttpRequestException($"Upload timed out after {client.Timeout.TotalMinutes} minutes", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file to Python service");
            throw;
        }
    }

    public Task<DateRangeValidationResponse> ValidateDateRangesAsync(DateRanges ranges)
    {
        throw new NotImplementedException("Date range validation is now handled by the Python service.");
    }
}

// Custom HttpContent for progress tracking
public class ProgressStreamContent : HttpContent
{
    private readonly Stream _stream;
    private readonly long _totalBytes;
    private readonly Action<UploadProgress> _onProgress;
    private long _bytesSent = 0;

    public ProgressStreamContent(Stream stream, long totalBytes, Action<UploadProgress> onProgress)
    {
        _stream = stream ?? throw new ArgumentNullException(nameof(stream));
        _totalBytes = totalBytes;
        _onProgress = onProgress;
    }

#if NET5_0_OR_GREATER
    protected override Task SerializeToStreamAsync(Stream stream, TransportContext? context)
    {
        return SerializeToStreamInternalAsync(stream, context);
    }
#else
    protected override Task SerializeToStreamAsync(Stream stream, TransportContext context)
    {
        return SerializeToStreamInternalAsync(stream, context);
    }
#endif

    private async Task SerializeToStreamInternalAsync(Stream stream, TransportContext? context)
    {
        const int bufferSize = 64 * 1024; // 64KB chunks
        var buffer = new byte[bufferSize];
        int bytesRead;

        while ((bytesRead = await _stream.ReadAsync(buffer, 0, buffer.Length)) > 0)
        {
            await stream.WriteAsync(buffer, 0, bytesRead);
            _bytesSent += bytesRead;

            // Report progress every 10MB or at the end
            if (_bytesSent % (10 * 1024 * 1024) == 0 || _bytesSent >= _totalBytes)
            {
                var progress = new UploadProgress
                {
                    BytesSent = _bytesSent,
                    TotalBytes = _totalBytes,
                    Percentage = (_bytesSent * 100.0) / _totalBytes
                };

                _onProgress?.Invoke(progress);
            }
        }
    }

    protected override bool TryComputeLength(out long length)
    {
        length = _totalBytes;
        return true;
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _stream?.Dispose();
        }
        base.Dispose(disposing);
    }
}

public class UploadProgress
{
    public long BytesSent { get; set; }
    public long TotalBytes { get; set; }
    public double Percentage { get; set; }
}
