import os
import aiofiles
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, status, BackgroundTasks
from fastapi.concurrency import run_in_threadpool
from models.response_models import TaskAcceptedResponse
from services import feature_selection_service
import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define the router
router = APIRouter(prefix="/dataset", tags=["1. Dataset Ingestion & Feature Selection"])


@router.post(
    "/store", response_model=TaskAcceptedResponse, status_code=status.HTTP_202_ACCEPTED
)
async def store_dataset_and_select_features(
    background_tasks: BackgroundTasks, file: UploadFile = File(...)
):
    """
    Accepts a dataset, stores it, and triggers a long-running feature
    selection process in the background.

    Responds immediately with a 202 Accepted status.

    - **file**: The CSV file uploaded from the backend.
    """
    try:
        # Save the uploaded file to the designated storage path
        async with aiofiles.open(config.DATASET_FILE_PATH, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)

        logger.info(f"Dataset successfully saved to {config.DATASET_FILE_PATH}")

    except Exception as e:
        logger.error(f"Failed to save uploaded file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # Trigger the synchronous, CPU-bound feature selection process
    logger.info("Adding feature selection task to background queue.")
    background_tasks.add_task(feature_selection_service.run_feature_selection)

    logger.info(
        "Sending 202 Accepted response to client while task runs in background."
    )
    return TaskAcceptedResponse(
        message="Task accepted. Feature selection is running in the background.",
        dataset_path=config.DATASET_FILE_PATH,
    )
