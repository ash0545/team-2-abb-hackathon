# .NET Backend API for AI Quality Control

This directory contains the ASP.NET Core 8 Web API that serves as the backend for the AI Quality Control application. It functions as a secure and robust Backend-for-Frontend (BFF), mediating all communication between the Angular UI and the Python ML microservice.

## Table of Contents

- [Overview](#overview)
- [Key Features & Endpoints](#key-features--endpoints)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)

## Overview

This service is the central pillar of the application's architecture. It exposes a clean, user-centric API to the frontend while encapsulating the complexities of interacting with the downstream Python ML service. Its primary responsibilities include handling large file uploads efficiently, performing business logic validation, and securely forwarding requests to the appropriate microservice.

## Key Features & Endpoints

### 1. Large Dataset Ingestion and Processing

- **Endpoint:** `POST /api/dataset/upload`
- **Functionality:**
  - Accepts multi-gigabyte CSV file uploads from the frontend.
  - Implements a **low-memory streaming pipeline** to process the file without loading it entirely into memory, preventing server crashes.
  - **Augments Data:** Adds a `synthetic_timestamp` column to each record on-the-fly with second-level granularity.
  - **Calculates Metadata:** In a single pass, calculates key dataset metrics (total records, pass rate, etc.) and the overall timestamp range.
  - **Forwards Data:** Streams the augmented CSV data directly to the Python ML service for storage and feature selection.
  - **Persists Metadata:** Saves the calculated metadata to a local JSON file (`storage/metadata.json`) for use in subsequent steps.
  - Returns the calculated metadata summary to the frontend.

### 2. Date Range Validation

- **Endpoint:** `POST /api/dataset/validate-ranges`
- **Functionality:**
  - Receives user-selected date ranges for training, testing, and simulation.
  - Performs **server-side business logic validation** using the persisted metadata, ensuring:
    - Ranges are sequential and non-overlapping.
    - Start dates are before end dates.
    - All selected dates fall within the dataset's overall timestamp range.
  - Returns a clear `Valid` or `Invalid` status with a descriptive message to the frontend.

### 3. ML Task Orchestration and Forwarding

- **Functionality:** Acts as a proxy for all ML and simulation tasks, providing a consistent API for the frontend.
- **Data Splitting:**
  - `POST /api/dataset/split-data`: Forwards the validated date ranges to the Python service to split the dataset. It relays the response, including daily record distribution data, back to the frontend.
- **Model Training:**
  - `POST /api/training/start`: Forwards the request to initiate asynchronous model training.
  - `GET /api/training/status/{taskId}`: Polls the Python service for the training task's live status and final results, relaying them to the frontend.
- **Real-Time Simulation:**
  - `POST /api/simulation/start`: Forwards the request to start the live inference simulation.
  - `POST /api/simulation/stop/{taskId}`: Forwards the request to terminate a running simulation.
  - `GET /api/simulation/status/{taskId}`: Polls the Python service for the live, one-second-interval data packets and relays them to the frontend.

## Tech Stack

- **Framework:** .NET 8 (ASP.NET Core Web API)
- **Key Features:**
  - Dependency Injection
  - `IHttpClientFactory` for resilient HTTP communication
  - Streaming I/O for large file handling
- **Language:** C# 12

## Getting Started

### Prerequisites

- .NET 8 SDK

### Running the Service

1. **Navigate to this directory:**

    ```bash
    cd backend-dotnet
    ```

2. **Restore dependencies and run:**
    *Ensure the Python ML service is running on `http://localhost:8000` as configured in `appsettings.json`.*

    ```bash
    dotnet run
    ```

3. **API documentation** (Swagger UI) will be available at `http://localhost:5000/swagger`.

## Project Structure

```
.
├── Controllers/    # API controllers that handle incoming HTTP requests from the frontend
├── Models/         # C# classes (DTOs) for API request/response bodies
├── Services/       # Contains business logic and communication with other services
├── storage/        # (Mounted Volume) For storing persistent metadata
├── appsettings.json  # Configuration for the application, including service URLs
└── Program.cs      # Application entry point and service configuration (DI)
```
