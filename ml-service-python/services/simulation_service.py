from celery_worker import celery_app, simulate_inference_task
from celery.result import AsyncResult
from models.response_models import SimulationProgress


def start_simulation() -> str:
    """
    Triggers the Celery simulation task and returns the task ID.
    """
    task = simulate_inference_task.delay()
    return task.id


def stop_simulation(task_id: str):
    """
    Stops (revokes) a running Celery task.
    terminate=True sends a SIGTERM to the process.
    """
    celery_app.control.revoke(task_id, terminate=True, signal="SIGTERM")


def get_simulation_status(task_id: str) -> dict:
    """
    Checks the status of a Celery simulation task.
    """
    task_result = AsyncResult(task_id, app=celery_app)

    result_payload = None
    progress_payload = None

    status = task_result.state

    if status == "SUCCESS":
        result_payload = task_result.result
    elif status == "REVOKED":
        result_payload = {"message": "Simulation was stopped by the user."}
    elif status == "PROGRESS":
        meta_info = task_result.info
        if meta_info and "current_row_index" in meta_info:
            # This is a full data stream packet, so validate it
            try:
                progress_payload = SimulationProgress.model_validate(
                    meta_info
                ).model_dump()
            except Exception as e:
                # Fallback in case of unexpected validation error during the stream
                status = "FAILURE"
                result_payload = {"error": f"Data packet validation error: {e}"}
        else:
            # This is a simple status message (like warmup), pass it through directly.
            # No Pydantic validation needed here.
            progress_payload = meta_info
    elif status == "FAILURE":
        progress_payload = {"status": str(task_result.info)}

    return {
        "task_id": task_id,
        "status": status,
        "progress": progress_payload,
        "result": result_payload,
    }
