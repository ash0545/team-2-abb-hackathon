namespace QualityControl.Controllers
{
    using QualityControl.Models;
    using QualityControl.Services;
    using Microsoft.AspNetCore.Mvc;
    using System;
    using System.IO;
    using System.Threading.Tasks;

    [ApiController]
    [Route("api/[controller]")]
    public class DatasetController : ControllerBase
    {
        private readonly ICsvProcessingService _csvProcessingService;
        private readonly ILogger<DatasetController> _logger;

        public DatasetController(ICsvProcessingService csvProcessingService, ILogger<DatasetController> logger)
        {
            _csvProcessingService = csvProcessingService;
            _logger = logger;
        }

        /// <summary>
        /// Uploads a CSV file and returns metadata including timestamp range.
        /// </summary>
        [HttpPost("upload")]
        [ProducesResponseType(typeof(DatasetMetadata), 200)]
        [ProducesResponseType(typeof(string), 400)]
        [ProducesResponseType(typeof(string), 500)]
        public async Task<IActionResult> UploadDataset(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            try
            {
                var metadata = await _csvProcessingService.ProcessCsvFileAsync(file);
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

        /// <summary>
        /// Validates user-provided date ranges for training, testing, and simulation.
        /// Returns record counts and monthly distribution for charting.
        /// </summary>
        [HttpPost("validate-date-ranges")]
        [ProducesResponseType(typeof(DateRangeValidationResponse), 200)]
        [ProducesResponseType(typeof(string), 500)]
        public async Task<IActionResult> ValidateDates([FromBody] DateRanges ranges)
        {
            try
            {
                var response = await _csvProcessingService.ValidateDateRangesAsync(ranges);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during date range validation.");
                return StatusCode(500, "Date range validation failed.");
            }
        }
    }
}
