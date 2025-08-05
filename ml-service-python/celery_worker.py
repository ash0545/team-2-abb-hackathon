import time
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
