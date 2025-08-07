graph TD

%% CLIENT LAYER
A1[User Interface: Angular App]
A1 --> A2[Step Navigation: Upload → Ranges → Train → Simulate]

%% .NET BACKEND
A2 --> B1[.NET Backend API]
B1 --> B2[Upload Endpoint: Validate and Parse CSV]
B2 --> B3{Timestamp Column Present?}
B3 -- Yes --> B4[Use Existing Timestamps]
B3 -- No --> B5[Generate Synthetic Timestamps]
B4 --> B6[Compute Metadata: Records, Columns, Pass Percent, Range]
B5 --> B6
B6 --> B7[Store in Memory or Temp File]
B7 --> C1

%% FASTAPI SERVICE
C1[Send to FastAPI store-endpoint]
C1 --> C2[FastAPI ML Service]
C2 --> C3[Store Dataset in Memory and Assign ID]

%% DATE RANGE VALIDATION
A2 --> B8[User Selects Date Ranges]
B8 --> B9[.NET Validates Overlap and Bounds]
B9 --> C4[Send to FastAPI create-split]
C4 --> C5[Split Dataset by Ranges]
C5 --> C6[Return Record Counts]
C6 --> B10[Send Validated Result to UI]

%% MODEL TRAINING
A2 --> B11[User Starts Training]
B11 --> C7[Send to FastAPI train-model]
C7 --> C8[Train Model using XGBoost or LightGBM]
C8 --> C9[Evaluate on Test Set]
C9 --> C10[Return Metrics: Accuracy, F1 Score, Charts]
C10 --> A1

%% SIMULATION
A2 --> B12[User Starts Simulation]
B12 --> C11[Send to FastAPI simulate]
C11 --> C12[Infer One Row at a Time]
C12 --> C13[Return Prediction and Confidence]
C13 --> A1

%% TEMP STORAGE
B7 --> D1[(In-Memory Dataset)]
C8 --> D2[(Model Artifacts)]
C9 --> D3[(Evaluation Results)]
