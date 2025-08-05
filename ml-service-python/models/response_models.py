from pydantic import BaseModel, Field
from datetime import datetime

# --- Stage 1 ---


class StoreDatasetResponse(BaseModel):
    """
    Defines the JSON response structure for the dataset storage and feature selection endpoint.
    """

    message: str
    dataset_path: str
    features_path: str
    num_features_selected: int


class TaskAcceptedResponse(BaseModel):
    """
    Defines the JSON response for a task that has been accepted for
    background processing.
    """

    message: str = Field(
        ..., example="Task accepted. Feature selection is running in the background."
    )
    dataset_path: str = Field(
        ..., example="/path/to/storage/data/full_dataset_with_ts.csv"
    )


# --- Stage 2 ---


class DateSplitRequest(BaseModel):
    """
    Defines the request model for splitting the dataset based on date ranges.
    FastAPI will automatically parse ISO 8601 date strings into datetime objects.
    """

    train_start_date: datetime
    train_end_date: datetime
    test_start_date: datetime
    test_end_date: datetime
    simulation_start_date: datetime
    simulation_end_date: datetime


class DataSplitResponse(BaseModel):
    """
    Defines the successful response after splitting the data.
    """

    message: str
    train_set_path: str
    train_set_rows: int
    test_set_path: str
    test_set_rows: int
    simulation_set_path: str
    simulation_set_rows: int
