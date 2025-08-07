using QualityControl.Models;

namespace QualityControl.Services
{
    public interface ICsvProcessingService
    {
        Task<DatasetMetadata> ProcessAndForwardCsvAsync(IFormFile file);
        Task<DateRangeValidationResponse> ValidateDateRangesAsync(DateRanges ranges);
    }
}
