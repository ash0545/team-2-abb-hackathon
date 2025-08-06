import logging
from fastapi import APIRouter, HTTPException
from services import simulation_service
from models.response_models import (
    SimulationStartResponse,
    SimulationStopResponse,
    SimulationStatusResponse,
)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/simulation", tags=["3. Real-Time Simulation"])


@router.post("/start", response_model=SimulationStartResponse)
async def start_realtime_simulation():
    """
    Triggers the real-time inference simulation in the background.
    """
    try:
        task_id = simulation_service.start_simulation()
        return SimulationStartResponse(task_id=task_id)
    except Exception as e:
        logger.error(f"Failed to start simulation task: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to queue simulation task.")


@router.post("/stop/{task_id}", response_model=SimulationStopResponse)
async def stop_realtime_simulation(task_id: str):
    """
    Stops a running simulation task.
    """
    try:
        simulation_service.stop_simulation(task_id)
        return SimulationStopResponse(
            task_id=task_id, message="Stop signal sent to simulation task."
        )
    except Exception as e:
        logger.error(f"Failed to stop task {task_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to send stop signal.")


@router.get("/status/{task_id}", response_model=SimulationStatusResponse)
async def get_simulation_status(task_id: str):
    """
    Polls for the status and live data of the simulation task.
    """
    status = simulation_service.get_simulation_status(task_id)
    return status
