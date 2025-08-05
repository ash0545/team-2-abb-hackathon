import logging
from fastapi import APIRouter, HTTPException, Body
from services import data_processing_service
from models.response_models import DateSplitRequest, DataSplitResponse

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/process", tags=["2. Data Processing & Splitting"])


@router.post("/split-data", response_model=DataSplitResponse)
async def create_data_splits(request: DateSplitRequest = Body(...)):
    """
    Takes date ranges, samples the main dataset, splits it into train, test,
    and simulation sets, and saves them.
    """
    try:
        logger.info("Received request to split data.")
        # This task is I/O bound and might be slow, but let's run it directly for now.
        # If it causes timeouts, we can move it to a background task.
        result = data_processing_service.split_dataset_by_dates(request)

        return DataSplitResponse(
            message="Data successfully sampled, split, and saved.", **result
        )

    except FileNotFoundError as e:
        logger.error(f"A required file was not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"An error occurred during data splitting: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")
