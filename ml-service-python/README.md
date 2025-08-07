# Python ML Microservice

This directory contains the Python microservice responsible for all machine learning operations in the AI Quality Control application. It is built with FastAPI and leverages Celery for asynchronous task management.

## Table of Contents

- [Overview](#overview)
- [Key Features & Endpoints](#key-features--endpoints)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)

## Overview

This service acts as the machine learning engine for the full-stack application. It is designed to handle large datasets, perform model training asynchronously, and provide a real-time inference stream. It communicates exclusively with the .NET backend API.

## Key Features & Endpoints

### 1. Dataset Ingestion and Feature Selection

- **Endpoint:** `POST /dataset/store`
- **Functionality:**
  - Accepts a large, pre-processed CSV file (with synthetic timestamps) via a streaming request to handle multi-gigabyte files with low memory usage.
  - Saves the dataset to persistent storage.
  - Triggers an asynchronous background task to perform feature selection. This involves training a preliminary XGBoost model on a data sample to identify the most important features, which are then saved for the main training stage.

### 2. Data Splitting

- **Endpoint:** `POST /process/split-data`
- **Functionality:**
  - Receives user-defined date ranges (for training, testing, and simulation).
  - Loads a representative sample of the full dataset using only the previously selected important features.
  - Splits the sampled data into three distinct datasets based on the provided UTC timestamps.
  - Calculates the daily distribution of records across the entire date range.
  - Saves the split datasets to storage and returns their row counts and the daily distribution data.

### 3. Asynchronous Model Training & Evaluation

- **Endpoints:**
  - `POST /process/train/start`
  - `GET /process/train/status/{task_id}`
- **Functionality:**
  - Initiates a long-running Celery task to train an XGBoost classifier on the prepared training data.
  - Provides real-time status updates (e.g., "Loading data...", "Training model...") via the status endpoint.
  - Upon completion, evaluates the model on the test set and stores a comprehensive result payload, including:
    - **Metrics:** Accuracy, Precision, Recall, and F1-Score.
    - **Chart Data:** Data points for training loss vs. accuracy curves.
    - **Confusion Matrix:** Counts for True Positives, False Positives, etc.
  - Saves the final trained model (`.joblib`) and training curve data (`.json`) as artifacts.

### 4. Real-Time Inference Simulation

- **Endpoints:**
  - `POST /simulation/start`
  - `GET /simulation/status/{task_id}`
  - `POST /simulation/stop/{task_id}`
- **Functionality:**
  - Initiates a long-running Celery task to simulate real-time inference on the simulation dataset.
  - Includes a configurable "warmup" period.
  - Processes one row per second, providing a paced data stream.
  - For each row, it returns a data packet containing:
    - A "Quality Score" (confidence of a "Pass" prediction).
    - Live statistics (total predictions, pass/fail counts, average confidence).
    - A detailed prediction record (timestamp, sample ID, prediction, confidence, and top feature values).
  - Supports task termination via the `/stop` endpoint.

## Tech Stack

- **Web Framework:** FastAPI
- **Async Task Queue:** Celery with a Redis backend
- **ML Framework:** XGBoost, Scikit-learn
- **Data Handling:** Pandas, NumPy
- **Server:** Uvicorn

## Getting Started

### Prerequisites

- Python 3.13+
- Redis Server

### Running the Service

1. **Navigate to this directory:**

    ```bash
    cd ml-service-python
    ```

2. **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

3. **Start the Redis server** (if not already running via Docker Compose).

    ```bash
    redis-server
    ```

4. **Start the Celery worker** in a separate terminal:

    ```bash
    celery -A celery_worker.celery_app worker --loglevel=info
    ```

5. **Start the FastAPI server** in another terminal:

    ```bash
    uvicorn main:app --reload
    ```

6. **API documentation** will be available at `http://localhost:8000/docs`.

## Project Structure

```
.
├── models/         # Pydantic models for API request/response validation
├── routes/         # API endpoint definitions (routers)
├── services/       # Core business logic (feature selection, data processing, etc.)
├── storage/        # (Mounted Volume) For storing datasets and ML artifacts
├── celery_worker.py  # Celery application and task definitions
├── config.py       # Configuration and constants
├── main.py         # FastAPI application entry point
└── requirements.txt  # Python package dependencies
```
