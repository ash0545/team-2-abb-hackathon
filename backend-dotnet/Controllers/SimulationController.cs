using Microsoft.AspNetCore.Mvc;
using QualityControl.Services;

namespace QualityControl.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SimulationController : ControllerBase
{
    private readonly ISimulationService _simulationService;
    private readonly ILogger<SimulationController> _logger;

    public SimulationController(ISimulationService simulationService, ILogger<SimulationController> logger)
    {
        _simulationService = simulationService;
        _logger = logger;
    }

    [HttpPost("start")]
    public async Task<IActionResult> StartSimulation()
    {
        _logger.LogInformation("Controller received request to start simulation.");
        try
        {
            var result = await _simulationService.StartSimulationAsync();
            return Ok(result);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "An exception occurred while starting the simulation.");
            return StatusCode(500, "An internal server error occurred while starting the simulation.");
        }
    }

    [HttpPost("stop/{task_id}")]
    public async Task<IActionResult> StopSimulation(string task_id)
    {
        if (string.IsNullOrEmpty(task_id)) return BadRequest("Task ID is required.");

        _logger.LogInformation("Controller received request to stop simulation task {TaskId}.", task_id);
        try
        {
            await _simulationService.StopSimulationAsync(task_id);
            return Ok(new { message = $"Stop signal sent to task {task_id}." });
        }
        catch (Exception e)
        {
            _logger.LogError(e, "An exception occurred while stopping simulation task {task_id}", task_id);
            return StatusCode(500, "An internal server error occurred while stopping the simulation.");
        }
    }

    [HttpGet("status/{task_id}")]
    public async Task<IActionResult> GetSimulationStatus(string task_id)
    {
        if (string.IsNullOrEmpty(task_id)) return BadRequest("Task ID is required.");

        try
        {
            var result = await _simulationService.GetSimulationStatusAsync(task_id);
            return Ok(result);
        }
        catch (Exception e)
        {
            // This might get noisy if the task ID expires on the FastAPI side, so log as warning.
            _logger.LogWarning(e, "An exception occurred while polling status for task {TaskId}", task_id);
            return StatusCode(500, $"An error occurred while fetching status for task {task_id}.");
        }
    }
}
