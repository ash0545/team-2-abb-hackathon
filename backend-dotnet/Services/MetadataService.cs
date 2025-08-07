using System.Text.Json;
using QualityControl.Models;

namespace QualityControl.Services
{
    public class MetadataService : IMetadataService
    {
        private readonly string _filePath;
        private static readonly JsonSerializerOptions _options = new() { WriteIndented = true };

        public MetadataService(IConfiguration configuration)
        {
            // Resolves the path relative to the application's content root
            _filePath = Path.Combine(AppContext.BaseDirectory,
                configuration["DataStorage:MetadataFilePath"] ?? "Data/metadata.json");

            // Ensure the directory exists
            var directory = Path.GetDirectoryName(_filePath);
            if (directory != null && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }
        }

        public async Task<DatasetMetadata?> GetMetadataAsync()
        {
            if (!File.Exists(_filePath))
            {
                return null;
            }
            var json = await File.ReadAllTextAsync(_filePath);
            return JsonSerializer.Deserialize<DatasetMetadata>(json);
        }

        public async Task SaveMetadataAsync(DatasetMetadata metadata)
        {
            var json = JsonSerializer.Serialize(metadata, _options);
            await File.WriteAllTextAsync(_filePath, json);
        }
    }
}
