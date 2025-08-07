using QualityControl.Models;

namespace QualityControl.Services
{
    public interface IMetadataService
    {
        Task SaveMetadataAsync(DatasetMetadata metadata);
        Task<DatasetMetadata?> GetMetadataAsync();
    }
}
