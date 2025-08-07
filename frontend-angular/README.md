# Angular Frontend

This directory contains the Angular (v18+) single-page application that serves as the user interface for the AI-Powered Quality Control Prediction System.

## Table of Contents

- [Overview](#overview)
- [Key Features Implemented](#key-features-implemented)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)

## Overview

The frontend provides a guided, step-by-step workflow for users to upload a dataset, train the model, and run a real-time prediction simulation. It communicates exclusively with a .NET backend API, which acts as a mediator for all machine learning operations. The application is built with a reactive architecture using RxJS to handle asynchronous operations and live data streams.

## Key Features Implemented

### Screen 1: Dataset Upload

- **Drag-and-Drop & File Input:** A user-friendly interface for uploading large CSV datasets.
- **Live Upload Progress:** A loading indicator is displayed while the backend processes the file.
- **Post-Upload Metadata Summary:** After a successful upload, a summary card displays key information extracted by the backend, including:
  - Total Records and Columns
  - Pass Rate Percentage
  - The full date range of the dataset (displayed in UTC).

### Screen 2: Date Range Configuration

- **Time-Based Splitting:** UI for selecting start and end dates for Training, Testing, and Simulation periods.
- **Backend-Driven Validation:** A "Validate Ranges" button that sends the selected dates to the backend for logical validation (sequential, non-overlapping, within bounds).

### Screen 3: Model Training and Evaluation

- **Asynchronous Model Training:** A single "Train Model" button initiates the training process on the backend.
- **Live Status Updates:** The UI displays a loading overlay with real-time status messages polled from the backend (e.g., "Loading data...", "Training model...").
- **Comprehensive Metrics Display:** Once training is complete, the following results are displayed:
  - **Metric Cards:** Accuracy, Precision, Recall, and F1-Score.
  - **Line Chart:** A visualization of Training Accuracy vs. Training Loss over epochs.
  - **Donut Chart:** A breakdown of the confusion matrix (True Positives, True Negatives, etc.).

### Screen 4: Real-Time Prediction Simulation

- **Simulation Control:** "Start Simulation" and "Stop Simulation" buttons to manage the inference process.
- **Live Data Streaming (1 Update/Second):** The UI polls the backend for new prediction data, updating all visuals once per second.
- **Warmup Period Handling:** Displays an "Initializing..." status during the simulation's warmup phase.
- **Live Statistics Panel:** Real-time updates for:
  - Total Predictions count
  - Pass & Fail counts
  - Running Average Confidence percentage.
- **Live Charts:**
  - **Line Chart:** Plots the "Quality Score" of each prediction against its timestamp.
  - **Donut Chart:** Visualizes the live distribution of "Pass" vs. "Fail" predictions.
- **Live Prediction Table:** A continuously updating table showing the latest predictions, including Timestamp, Sample ID, Prediction, Confidence, and the top 3 most important features.

## Tech Stack

- **Framework:** Angular 18+
- **State Management:** RxJS
- **Styling:** SCSS
- **Charting:** Chart.js
- **HTTP Client:** Angular `HttpClient`

## Getting Started

### Prerequisites

- Node.js (v20+)
- Angular CLI (v18+)

### Running the Application

1. **Navigate to this directory:**

    ```bash
    cd frontend-angular
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Run the development server:**
    *Ensure the .NET backend is running on `http://localhost:5000`.*

    ```bash
    ng serve
    ```

4. **Access the application at `http://localhost:4200`**.

## Project Structure

The application code is organized as follows:

```
src/app/
├── components/   # Main application components
│   └── steps/    # Components for each step of the workflow (Upload, Ranges, etc.)
├── models/       # TypeScript interfaces for API data contracts (api.models.ts)
└── services/     # Angular services for API communication (api.service.ts)
```
