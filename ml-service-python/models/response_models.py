from pydantic import BaseModel, Field


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
