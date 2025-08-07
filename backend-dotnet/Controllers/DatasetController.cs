using QualityControl.Models;
using QualityControl.Services;
using Microsoft.AspNetCore.Mvc;

namespace QualityControl.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DatasetController : ControllerBase
    {
        private readonly ICsvProcessingService _csvProcessingService;
        private readonly IDatasetService _datasetService;
        private readonly ILogger<DatasetController> _logger;

        public DatasetController(ICsvProcessingService csvProcessingService, IDatasetService datasetService, ILogger<DatasetController> logger)
        {
            _csvProcessingService = csvProcessingService;
            _datasetService = datasetService;
            _logger = logger;
        }

        [HttpPost("upload")]
        [ProducesResponseType(typeof(DatasetMetadata), 200)]
        [ProducesResponseType(typeof(string), 400)]
        [ProducesResponseType(typeof(string), 500)]
        // Add this attribute to disable the default request body size limit for this specific action
        [RequestSizeLimit(3_000_000_000)] // ~3 GB limit
        [RequestFormLimits(MultipartBodyLengthLimit = 3_000_000_000)]
        public async Task<IActionResult> UploadDataset(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            try
            {
                // Use the new streaming method
                var metadata = await _csvProcessingService.ProcessAndForwardCsvAsync(file);
                return Ok(metadata);
            }
            catch (InvalidDataException ex)
            {
                _logger.LogError(ex, "Invalid data in uploaded file.");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred during file upload.");
                return StatusCode(500, "An internal server error occurred. Please try again later.");
            }
        }

        [HttpPost("validate-ranges")]
        public async Task<IActionResult> ValidateRanges([FromBody] DateRanges ranges)
        {
            var response = await _datasetService.ValidateDateRangesAsync(ranges);
            if (response.Status != "Valid")
                return BadRequest(response);
            return Ok(response);
        }

        [HttpPost("split-data")]
        public async Task<IActionResult> SplitData([FromBody] DateRanges ranges)
        {
            try
            {
                var response = await _datasetService.SplitDataAsync(ranges);
                if (response == null)
                    return StatusCode(500, "Failed to split data in the ML service.");

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while triggering data split.");
                return StatusCode(500, "An internal server error occurred.");
            }
        }
    }
}
