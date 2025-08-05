import os
import pandas as pd
import numpy as np
import xgboost as xgb
import json
import logging
import config
import gc

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def downcast_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Reduces DataFrame memory usage by downcasting numeric columns to more
    efficient types.
    """
    logger.info("Downcasting numeric columns to save memory...")
    f_cols = df.select_dtypes("float").columns
    i_cols = df.select_dtypes("integer").columns

    df[f_cols] = df[f_cols].apply(pd.to_numeric, downcast="float")
    df[i_cols] = df[i_cols].apply(pd.to_numeric, downcast="integer")

    logger.info("Downcasting complete.")
    return df


def run_feature_selection():
    """
    Performs feature selection on the stored dataset.

    This function reads the full dataset, takes a sample, trains a preliminary
    XGBoost model, extracts the most important features, and saves them to a file.

    Returns:
        int: The number of features selected.

    Raises:
        FileNotFoundError: If the dataset file is not found.
        Exception: For any other errors during the process.
    """
    if not os.path.exists(config.DATASET_FILE_PATH):
        raise FileNotFoundError(
            f"Dataset not found at {config.DATASET_FILE_PATH}. Please upload it first."
        )

    logger.info("Starting feature selection using a data sample...")

    # Read the data in chunks and sample from each chunk to manage memory
    try:
        logger.info(
            f"Reading dataset in chunks of {config.CHUNK_SIZE} rows from {config.DATASET_FILE_PATH}"
        )
        chunks = pd.read_csv(config.DATASET_FILE_PATH, chunksize=config.CHUNK_SIZE)
        sample_df_list = []
        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk #{i+1} with {len(chunk)} rows...")
            sample = chunk.sample(frac=config.SAMPLE_FRACTION, random_state=42)
            sample = downcast_df(sample)
            logger.info(
                f"  -> Taking a {config.SAMPLE_FRACTION*100}% sample: {len(sample)} rows."
            )
            sample_df_list.append(sample)
        logger.info(
            "All chunks processed. Concatenating samples into a single DataFrame..."
        )
        sample_df = pd.concat(sample_df_list, ignore_index=True)
        logger.info(
            f"Sampled DataFrame created with {len(sample_df)} rows for feature selection."
        )

        del sample_df_list
        gc.collect()
        logger.info(
            "Freed memory by deleting chunk list and running garbage collector."
        )
    except Exception as e:
        logger.error(f"Error reading or sampling the dataset: {e}")
        raise

    # Prepare data for the preliminary model
    # Drop ID, Target, and the synthetic timestamp for training
    X_sample = sample_df.drop(
        columns=[config.ID_COLUMN, config.TARGET_COLUMN, config.TIMESTAMP_COLUMN]
    )
    y_sample = sample_df[config.TARGET_COLUMN]

    # Train a preliminary XGBoost model to get feature importances
    logger.info("Training preliminary XGBoost model on the sample...")
    prelim_model = xgb.XGBClassifier(use_label_encoder=False, eval_metric="logloss")
    prelim_model.fit(X_sample, y_sample)

    # Get feature importances and select the most important ones
    importances = prelim_model.feature_importances_
    indices = np.argsort(importances)[::-1]
    important_features = list(X_sample.columns[indices[: config.N_TOP_FEATURES]])

    logger.info(f"Selected the top {len(important_features)} most important features.")

    # Save the list of important features to the specified file
    try:
        with open(config.IMPORTANT_FEATURES_PATH, "w") as f:
            json.dump(important_features, f, indent=4)
        logger.info(f"Important features saved to {config.IMPORTANT_FEATURES_PATH}")
    except Exception as e:
        logger.error(f"Error saving important features: {e}")
        raise

    return len(important_features)
