using Microsoft.AspNetCore.Mvc;
using QualityControl.Services;

namespace QualityControl.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrainingController : ControllerBase
{
    private readonly ITrainingService _trainingService;
    private readonly ILogger<TrainingController> _logger;

    public TrainingController(ITrainingService trainingService, ILogger<TrainingController> logger)
    {
        _trainingService = trainingService;
        _logger = logger;
    }

    [HttpPost("start")]
    public async Task<IActionResult> StartTraining()
    {
        _logger.LogInformation("Received request to start model training.");
        try
        {
            var result = await _trainingService.StartTrainingAsync();
            if (result == null)
            {
                return StatusCode(500, "Failed to start training task.");
            }
            return Ok(result);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "An exception occurred while trying to start training.");
            return StatusCode(500, "An internal server error occurred.");
        }
    }

    [HttpGet("status/{task_id}")]
    public async Task<IActionResult> GetStatus(string task_id)
    {
        if (string.IsNullOrEmpty(task_id))
        {
            return BadRequest("Task ID cannot be null or empty.");
        }

        try
        {
            var result = await _trainingService.GetTrainingStatusAsync(task_id);
            if (result == null)
            {
                return NotFound($"No status found for task ID: {task_id}");
            }
            return Ok(result);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "An exception occurred while fetching status for task {task_id}", task_id);
            return StatusCode(500, "An internal server error occurred.");
        }
    }
}
