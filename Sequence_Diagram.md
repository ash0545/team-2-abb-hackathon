```mermaid 
sequenceDiagram
    participant User
    participant AngularApp
    participant DotNetAPI
    participant FastAPI_ML

    User->>AngularApp: Upload CSV
    AngularApp->>DotNetAPI: POST /upload-csv
    DotNetAPI->>DotNetAPI: Validate CSV (rows, columns)\nSynthesize datetime\nCalculate dataset metrics
    DotNetAPI->>FastAPI_ML: POST /store-endpoint
    FastAPI_ML->>FastAPI_ML: Store dataset\nFeature selection (maybe)\nReturn dataset_id
    FastAPI_ML-->>DotNetAPI: Success (dataset_id)

    User->>AngularApp: Select Date Range
    AngularApp->>DotNetAPI: POST /validate-range
    DotNetAPI->>DotNetAPI: Validate using stored metadata\nCalculate metrics
    DotNetAPI->>FastAPI_ML: POST /create-split
    FastAPI_ML->>FastAPI_ML: Split stored dataset into train/test/simulate
    FastAPI_ML-->>DotNetAPI: Success
    DotNetAPI-->>AngularApp: Send metrics to UI

    User->>AngularApp: Start Model Training
    AngularApp->>DotNetAPI: POST /train
    DotNetAPI->>FastAPI_ML: POST /train-model (with dataset_id)
    FastAPI_ML->>FastAPI_ML: Train model (XGBoost/LightGBM)\nStart Celery Task
    FastAPI_ML-->>DotNetAPI: Training started
    Note over DotNetAPI,FastAPI_ML: Use Celery for training status updates

    User->>AngularApp: Start Simulation
    AngularApp->>DotNetAPI: POST /simulate
    DotNetAPI->>FastAPI_ML: POST /simulate (with dataset_id)
    FastAPI_ML->>FastAPI_ML: Inference on simulate set\nCelery Task
    loop Every 1 sec
        AngularApp->>DotNetAPI: Poll for prediction update
        DotNetAPI->>FastAPI_ML: Request Prediction
        FastAPI_ML-->>DotNetAPI: Prediction + Confidence
        DotNetAPI-->>AngularApp: Update UI with Prediction
    end