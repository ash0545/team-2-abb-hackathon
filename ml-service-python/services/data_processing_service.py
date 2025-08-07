import pandas as pd
import json
import logging
import os
import gc
import config
from models.response_models import DateSplitRequest

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def split_dataset_by_dates(request: DateSplitRequest) -> dict:
    """
    Samples the main dataset, splits it into train, test, and simulation sets
    based on provided dates, and saves them as separate CSVs.
    """
    logger.info("--- Starting Data Sampling and Splitting Process ---")

    # --- 1. Load Prerequisite Artifacts ---
    logger.info(f"Loading important features from {config.IMPORTANT_FEATURES_PATH}")
    if not os.path.exists(config.IMPORTANT_FEATURES_PATH):
        raise FileNotFoundError(
            "Important features file not found. Please run the feature selection step first."
        )
    with open(config.IMPORTANT_FEATURES_PATH, "r") as f:
        important_features = json.load(f)

    if not os.path.exists(config.DATASET_FILE_PATH):
        raise FileNotFoundError(
            "Full dataset not found. Please run the ingestion step first."
        )

    # Define all columns to load: features + ID, target, and timestamp for filtering
    cols_to_load = [
        config.ID_COLUMN,
        config.TARGET_COLUMN,
        config.TIMESTAMP_COLUMN,
    ] + important_features

    # --- 2. Sample the Dataset (to replicate notebook logic and manage memory) ---
    logger.info(
        f"Creating a {config.DATA_SAMPLE_FRACTION_FOR_TRAINING*100}% sample of the dataset."
    )
    sampled_chunks = []
    for chunk in pd.read_csv(
        config.DATASET_FILE_PATH, usecols=cols_to_load, chunksize=config.CHUNK_SIZE
    ):
        sampled_chunks.append(
            chunk.sample(frac=config.DATA_SAMPLE_FRACTION_FOR_TRAINING, random_state=42)
        )

    full_sampled_df = pd.concat(sampled_chunks, ignore_index=True)
    logger.info(f"Created a single sampled DataFrame with {len(full_sampled_df)} rows.")

    # Convert timestamp column to datetime objects AND localize it to UTC to match
    # the timezone-aware datetimes coming from the FastAPI request model.
    #
    logger.info("Converting timestamp column to timezone-aware UTC datetime objects.")
    full_sampled_df[config.TIMESTAMP_COLUMN] = pd.to_datetime(
        full_sampled_df[config.TIMESTAMP_COLUMN]
    ).dt.tz_localize("UTC")

    del sampled_chunks
    gc.collect()

    # --- NEW: Calculate daily distribution ---
    logger.info("Calculating daily record distribution.")
    # Ensure timestamp is datetime, then group by date and count
    daily_dist_series = (
        full_sampled_df.set_index(config.TIMESTAMP_COLUMN).resample("D").size()
    )
    # Convert to dictionary with string keys in 'YYYY-MM-DD' format
    daily_distribution = {
        index.strftime("%Y-%m-%d"): count
        for index, count in daily_dist_series.items()
        if count > 0
    }

    # --- 3. Split the Sampled DataFrame based on Date Ranges ---
    logger.info("Splitting the sampled data into train, test, and simulation sets.")

    train_df = full_sampled_df[
        (full_sampled_df[config.TIMESTAMP_COLUMN] >= request.train_start_date)
        & (full_sampled_df[config.TIMESTAMP_COLUMN] <= request.train_end_date)
    ]

    test_df = full_sampled_df[
        (full_sampled_df[config.TIMESTAMP_COLUMN] >= request.test_start_date)
        & (full_sampled_df[config.TIMESTAMP_COLUMN] <= request.test_end_date)
    ]

    simulation_df = full_sampled_df[
        (full_sampled_df[config.TIMESTAMP_COLUMN] >= request.simulation_start_date)
        & (full_sampled_df[config.TIMESTAMP_COLUMN] <= request.simulation_end_date)
    ]

    logger.info(
        f"Split complete. Train: {len(train_df)}, Test: {len(test_df)}, Simulation: {len(simulation_df)} rows."
    )

    # --- 4. Save the Split DataFrames ---
    logger.info(f"Saving train set to {config.TRAIN_SET_PATH}")
    train_df.to_csv(config.TRAIN_SET_PATH, index=False)

    logger.info(f"Saving test set to {config.TEST_SET_PATH}")
    test_df.to_csv(config.TEST_SET_PATH, index=False)

    logger.info(f"Saving simulation set to {config.SIMULATION_SET_PATH}")
    simulation_df.to_csv(config.SIMULATION_SET_PATH, index=False)

    logger.info("--- Data Sampling and Splitting Process Finished ---")

    # --- 5. Return results for the response ---
    return {
        "train_set_path": config.TRAIN_SET_PATH,
        "train_set_rows": len(train_df),
        "test_set_path": config.TEST_SET_PATH,
        "test_set_rows": len(test_df),
        "simulation_set_path": config.SIMULATION_SET_PATH,
        "simulation_set_rows": len(simulation_df),
        "daily_distribution": daily_distribution,
    }
