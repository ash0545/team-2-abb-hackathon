import time
import numpy as np
import pandas as pd
import xgboost as xgb
import joblib
import json
import logging
import gc
from celery import Celery, Task
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)
import config

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery(
    "tasks", broker=config.CELERY_BROKER_URL, backend=config.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_track_started=True,
)


# --- NEW: JSON Sanitizer Helper Function ---
def make_json_serializable(obj):
    """
    Recursively traverses a dictionary or list to convert non-serializable
    numpy types to standard Python types.
    """
    if isinstance(obj, dict):
        return {k: make_json_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [make_json_serializable(elem) for elem in obj]
    if isinstance(obj, (np.integer, np.int64)):
        return int(obj)
    if isinstance(obj, (np.floating, np.float32, np.float64)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    return obj


@celery_app.task(bind=True)
def train_model_task(self: Task) -> dict:
    """
    Celery task to train the XGBoost model, evaluate it, and save artifacts.
    """
    try:
        # --- 1. Update Status: Loading Data ---
        self.update_state(
            state="PROGRESS", meta={"status": "Loading and preparing data..."}
        )
        logger.info("Task started: Loading and preparing data.")

        train_df = pd.read_csv(config.TRAIN_SET_PATH)
        test_df = pd.read_csv(config.TEST_SET_PATH)

        with open(config.IMPORTANT_FEATURES_PATH, "r") as f:
            important_features = json.load(f)

        X_train = train_df[important_features]
        y_train = train_df[config.TARGET_COLUMN]
        X_test = test_df[important_features]
        y_test = test_df[config.TARGET_COLUMN]

        del train_df, test_df
        gc.collect()

        # --- 2. Update Status: Training Model ---
        self.update_state(
            state="PROGRESS", meta={"status": "Training XGBoost model..."}
        )
        logger.info("Data loaded. Starting model training.")

        model = xgb.XGBClassifier(
            n_estimators=config.N_ESTIMATORS,
            max_depth=config.MAX_DEPTH,
            learning_rate=config.LEARNING_RATE,
            use_label_encoder=False,
            objective=config.OBJECTIVE,
            eval_metric=["logloss", "error"],
        )

        model.fit(X_train, y_train, eval_set=[(X_train, y_train)], verbose=False)
        logger.info("Model training complete.")

        # --- 3. Update Status: Evaluating Model ---
        self.update_state(
            state="PROGRESS", meta={"status": "Evaluating model on test set..."}
        )
        logger.info("Evaluating model.")
        y_pred = model.predict(X_test)

        # Calculate metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)

        # Calculate confusion matrix components
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

        # --- 4. Update Status: Processing Results ---
        self.update_state(
            state="PROGRESS", meta={"status": "Processing and saving results..."}
        )
        logger.info("Processing results and generating chart data.")

        # Process training curves for chart
        eval_results = model.evals_result()["validation_0"]
        epochs = range(len(eval_results["logloss"]))

        training_chart_data = {
            "train_loss": [
                {"x": i, "y": v} for i, v in enumerate(eval_results["logloss"])
            ],
            "train_accuracy": [
                {"x": i, "y": 1 - v} for i, v in enumerate(eval_results["error"])
            ],
        }

        # --- 5. Save Artifacts ---
        joblib.dump(model, config.MODEL_SAVE_PATH)
        logger.info(f"Model saved to {config.MODEL_SAVE_PATH}")

        with open(config.CURVES_SAVE_PATH, "w") as f:
            json.dump(training_chart_data, f, indent=4)
        logger.info(f"Training curves saved to {config.CURVES_SAVE_PATH}")

        # --- 6. Assemble Final Payload ---
        final_result = {
            "metrics": {
                "accuracy": acc,
                "precision": prec,
                "recall": rec,
                "f1_score": f1,
            },
            "training_chart": training_chart_data,
            "confusion_matrix": {
                "true_positives": int(tp),
                "false_positives": int(fp),
                "true_negatives": int(tn),
                "false_negatives": int(fn),
            },
            "model_path": config.MODEL_SAVE_PATH,
            "curves_path": config.CURVES_SAVE_PATH,
        }

        logger.info("Task completed successfully.")
        return final_result

    except Exception as e:
        logger.error(f"Task failed: {e}", exc_info=True)
        self.update_state(state="FAILURE", meta={"status": str(e)})
        # Re-raise the exception so Celery knows it failed
        raise e


@celery_app.task(bind=True)
def simulate_inference_task(self: Task) -> dict:
    """
    Celery task to simulate real-time inference on the simulation dataset.
    """
    try:
        # --- 0. Warmup Period ---
        warmup_status = f"Initializing simulation... Warmup period of {config.SIMULATION_WARMUP_PERIOD_SECONDS} seconds."
        logger.info(warmup_status)
        self.update_state(state="PROGRESS", meta={"status": warmup_status})
        time.sleep(config.SIMULATION_WARMUP_PERIOD_SECONDS)

        # --- 1. Load Artifacts and Data ---
        self.update_state(
            state="PROGRESS", meta={"status": "Initializing simulation..."}
        )
        logger.info("Simulation Task: Loading model and data.")

        model = joblib.load(config.MODEL_SAVE_PATH)
        sim_df = pd.read_csv(config.SIMULATION_SET_PATH)

        with open(config.IMPORTANT_FEATURES_PATH, "r") as f:
            important_features = json.load(f)

        # Get the top 3 most important features for the live table
        top_3_features = important_features[:3]

        # --- 2. Initialize Live Statistics ---
        live_stats = {
            "total_predictions": 0,
            "pass_count": 0,
            "fail_count": 0,
            "confidence_sum": 0.0,
            "average_confidence": 0.0,
        }
        total_rows = len(sim_df)

        # --- 3. Start the Simulation Loop ---
        logger.info(f"Starting simulation for {total_rows} records.")
        for index, row in sim_df.iterrows():
            # Prepare single row for prediction
            row_features = row[important_features].values.reshape(1, -1)

            # Get prediction probabilities
            probabilities = model.predict_proba(row_features)[
                0
            ]  # e.g., [P(pass), P(fail)]

            # Calculate Quality Score and Confidence
            pass_probability = probabilities[0]
            quality_score = pass_probability * 100

            # Determine prediction
            prediction_label = "Pass" if pass_probability >= 0.5 else "Fail"

            # Update live statistics
            live_stats["total_predictions"] += 1
            live_stats["confidence_sum"] += quality_score
            live_stats["average_confidence"] = (
                live_stats["confidence_sum"] / live_stats["total_predictions"]
            )
            if prediction_label == "Pass":
                live_stats["pass_count"] += 1
            else:
                live_stats["fail_count"] += 1

            log_message = (
                f"Row {index + 1}/{total_rows} | "
                f"ID: {int(row[config.ID_COLUMN])} | "
                f"Pred: {prediction_label} | "
                f"Conf: {quality_score:.2f}% | "
                f"Avg Conf: {live_stats['average_confidence']:.2f}%"
            )
            logger.info(log_message)

            # Assemble the data packet for this single row
            progress_payload = {
                "current_row_index": index,
                "total_rows": total_rows,
                "quality_score": quality_score,
                "live_prediction": {
                    "timestamp": row[config.TIMESTAMP_COLUMN],
                    "sample_id": f"SAMPLE_{int(row[config.ID_COLUMN])}",
                    "prediction": prediction_label,
                    "confidence": quality_score,
                    "top_features": row[top_3_features].to_dict(),
                },
                "live_stats": {
                    "total_predictions": live_stats["total_predictions"],
                    "pass_count": live_stats["pass_count"],
                    "fail_count": live_stats["fail_count"],
                    "average_confidence": live_stats["average_confidence"],
                },
            }

            # --- Sanitize the payload before updating state ---
            serializable_payload = make_json_serializable(progress_payload)

            logger.info(
                f"Row {serializable_payload['current_row_index'] + 1}/{total_rows} | "
                f"ID: {serializable_payload['live_prediction']['sample_id']} | "
                f"Pred: {serializable_payload['live_prediction']['prediction']} | "
                f"Conf: {serializable_payload['live_prediction']['confidence']:.2f}% | "
                f"Avg Conf: {serializable_payload['live_stats']['average_confidence']:.2f}%"
            )

            # Update Celery task state with the new data packet
            self.update_state(state="PROGRESS", meta=serializable_payload)

            # --- The Pacer ---
            time.sleep(1)

        final_summary = {
            "message": f"Simulation complete. Processed {total_rows} records."
        }
        logger.info(final_summary["message"])
        return final_summary

    except Exception as e:
        logger.error(f"Simulation task failed: {e}", exc_info=True)
        self.update_state(state="FAILURE", meta={"status": str(e)})
        raise e
