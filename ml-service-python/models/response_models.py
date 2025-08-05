from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Any, Dict, Optional

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


# --- Stage 3 ---
# --- Sub-models for the final result ---
class Metrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float


class ChartDataPoint(BaseModel):
    x: Any
    y: float


class TrainingChart(BaseModel):
    train_loss: List[ChartDataPoint]
    train_accuracy: List[ChartDataPoint]


class ConfusionMatrix(BaseModel):
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int


class TrainingResult(BaseModel):
    metrics: Metrics
    training_chart: TrainingChart
    confusion_matrix: ConfusionMatrix
    model_path: str
    curves_path: str


# --- Main Response Models for the Endpoints ---
class TrainingStartResponse(BaseModel):
    task_id: str


class TrainingStatusResponse(BaseModel):
    task_id: str
    status: str  # e.g., PENDING, PROGRESS, SUCCESS, FAILURE
    progress: Optional[Dict[str, Any]] = (
        None  # e.g., {'stage': 'Training', 'detail': 'Epoch 50/200'}
    )
    result: Optional[TrainingResult] = (
        None  # The final result payload, only present on SUCCESS
    )
