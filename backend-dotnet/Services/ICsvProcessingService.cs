namespace QualityControl.Services
{
    using QualityControl.Models; // <--- THIS IS THE FIX
    using Microsoft.AspNetCore.Http;
    using System.Threading.Tasks;
    public interface ICsvProcessingService
    {
        Task<DatasetMetadata> ProcessCsvFileAsync(IFormFile file);
        Task<DateRangeValidationResponse> ValidateDateRangesAsync(DateRanges ranges);
    }
}
