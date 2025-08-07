# IntelliInspect: Real-Time Predictive Quality Control with Kaggle Instrumentation Data

A full-stack AI-powered application enabling real-time quality control prediction using Kaggle Production Line sensor data.

This repository contains the source code for a full-stack, AI-powered application designed for real-time quality control prediction. The system uses sensor data from a production line to train a machine learning model and simulate live inference, providing a comprehensive solution from data upload to prediction.

## Team Members

- Ashwin Santhosh
- Sandeep U
- Nirmal Saseendran
- T Vaishnavi Singh

**Mentor**: Saisudhane G

## Table of Contents

- [IntelliInspect: Real-Time Predictive Quality Control with Kaggle Instrumentation Data](#intelliinspect-real-time-predictive-quality-control-with-kaggle-instrumentation-data)
  - [Team Members](#team-members)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Tech Stack](#tech-stack)
  - [Architecture](#architecture)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Docker Setup (Recommended)](#docker-setup-recommended)
    - [Local Setup](#local-setup)
  - [For Developers](#for-developers)
    - [Using the Dev Container](#using-the-dev-container)
  - [Project Structure](#project-structure)
  - [Usage](#usage)

## Project Overview

This application provides an end-to-end workflow for quality control:

1. **Dataset Upload:** Users can upload a large production line dataset (~2GB). The system processes this data in a stream to avoid memory issues.
2. **Date Range Configuration:** Define time-based splits for training, testing, and simulation, validated against the dataset's timestamps.
3. **Model Training & Evaluation:** Train an XGBoost model using asynchronous tasks and view detailed performance metrics, including accuracy, precision, and training curves.
4. **Real-Time Simulation:** Simulate live model inference on historical data, with predictions and statistics updating on the frontend every second.

## Tech Stack

| Component            | Technology                                                                             |
| -------------------- | -------------------------------------------------------------------------------------- |
| **Frontend**         | [Angular](https://angular.io/) (v18+)                                                  |
| **Backend API**      | [.NET 8](https://dotnet.microsoft.com/en-us/) (ASP.NET Core)                           |
| **ML Service**       | [Python 3.13](https://www.python.org/), [FastAPI](https://fastapi.tiangolo.com/)       |
| **ML Model**         | [XGBoost](https://xgboost.ai/)                                                         |
| **Async Tasks**      | [Celery](https://docs.celeryq.dev/en/stable/) with [Redis](https://redis.io/)          |
| **Containerization** | [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) |

## Architecture

The system is designed with a microservices architecture:

- **Angular UI:** The user-facing single-page application.
- **.NET Backend:** Acts as a Backend-for-Frontend (BFF), mediating all requests between the UI and the ML service. It handles business logic like date validation.
- **Python ML Service:** A dedicated microservice for all machine learning operations, including feature selection, model training, and real-time inference.
- **Celery & Redis:** Manage long-running, asynchronous tasks like model training and simulation, providing real-time status updates.

All components are containerized and orchestrated via Docker Compose for easy deployment and scalability.

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) and Docker Compose
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (for local setup)
- [Node.js](https://nodejs.org/) (v20+) and [Angular CLI](https://angular.io/cli) (for local setup)
- [Python 3.13](https://www.python.org/downloads/) (for local setup)
- [Redis](https://redis.io/docs/getting-started/installation/) (for local setup)

### Docker Setup (Recommended)

This is the simplest way to get the entire application running.

1. **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```

2. **Build and run the services using Docker Compose:**

    ```bash
    docker-compose up --build
    ```

3. **Access the application:**
    - **Frontend:** `http://localhost:4200`
    - **.NET Backend API:** `http://localhost:5000/swagger`
    - **Python ML Service API:** `http://localhost:8000/docs`

### Local Setup

To run each service manually without Docker.

1. **Clone the repository.**

2. **Run the ML Service:**
    - Navigate to the `ml-service-python` directory.
    - Install dependencies: `pip install -r requirements.txt`
    - Start Redis server: `redis-server`
    - Start Celery worker: `celery -A celery_worker.celery_app worker --loglevel=info`
    - Start FastAPI server: `uvicorn main:app --reload`

3. **Run the .NET Backend:**
    - Navigate to the `backend-dotnet` directory.
    - Restore dependencies and run: `dotnet run`

4. **Run the Angular Frontend:**
    - Navigate to the `frontend-angular` directory.
    - Install dependencies: `npm install`
    - Start the development server: `ng serve`

5. **Access the application at `http://localhost:4200`.**

## For Developers

### Using the Dev Container

This project includes a pre-configured [Dev Container](https://containers.dev/) for a consistent development environment.

1. **Prerequisites:**
    - VS Code
    - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
    - VS Code [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. **To Launch:**
    - Open the cloned repository in VS Code.
    - When prompted, click "Reopen in Container".
    - This will build the Docker image specified in `.devcontainer/Dockerfile` and start a container with all necessary runtimes (.NET, Node, Python) and VS Code extensions installed. You can then run each service locally from the integrated terminal as described in the [Local Setup](#local-setup) section.

## Project Structure

```
.
├── backend-dotnet/      # .NET 8 Backend API
├── frontend-angular/    # Angular 18+ Frontend UI
├── ml-service-python/   # Python 3.13 ML Service
├── storage/             # Persistent storage for dataset, models, etc. (mounted as a volume)
├── .devcontainer/       # Configuration for VS Code Dev Container
├── docker-compose.yaml  # Docker Compose orchestration file
└── README.md            # This file
```

## Usage

Once the application is running, open your browser to `http://localhost:4200` and follow the on-screen steps:

1. **Upload:** Upload the Kaggle production line dataset.
2. **Configure:** Set the date ranges for training, testing, and simulation.
3. **Train:** Start the model training process and monitor its progress.
4. **Simulate:** Run the real-time prediction simulation and observe the live metrics.
