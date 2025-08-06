from celery_worker import celery_app, train_model_task
from celery.result import AsyncResult
from models.response_models import TrainingResult


def start_training_session() -> str:
    """
    Triggers the Celery training task and returns the task ID.
    """
    task = train_model_task.delay()
    return task.id


def get_training_status(task_id: str) -> dict:
    """
    Checks the status of a Celery task.
    """
    task_result = AsyncResult(task_id, app=celery_app)

    result_payload = None
    progress_payload = None

    if task_result.state == "SUCCESS":
        # If successful, parse the result using our Pydantic model
        result_payload = TrainingResult.model_validate(task_result.result).model_dump()
    elif task_result.state == "PROGRESS":
        progress_payload = task_result.info  # This contains our custom 'meta' dict
    elif task_result.state == "FAILURE":
        # Provide the error message on failure
        progress_payload = {"status": str(task_result.info)}

    return {
        "task_id": task_id,
        "status": task_result.state,
        "progress": progress_payload,
        "result": result_payload,
    }
