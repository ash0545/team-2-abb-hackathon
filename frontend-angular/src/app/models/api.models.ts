// This file contains all the data structures for API requests and responses.

// --- Stage 1 ---

export interface DatasetMetadata {
  numberOfRecords: number;
  numberOfColumns: number;
  passRatePercentage: number;
  firstTimestamp: string;
  lastTimestamp: string;
  fileName: string;
  fileSize: string;
  timestampsAreSynthetic: boolean; // New property
}

// --- Stage 2 ---

export interface DateRanges {
  trainStart: string;
  trainEnd: string;
  testStart: string;
  testEnd: string;
  simulationStart: string;
  simulationEnd: string;
}

// Model for the .NET validation response
export interface DateRangeValidationResponse {
  status: 'Valid' | 'Invalid';
  message: string;
}

export interface DataSplitResponse {
  message: string;
  trainSetRows: number;
  testSetRows: number;
  simulationSetRows: number;
  dailyDistribution: { [key: string]: number }; // Key is 'YYYY-MM-DD'
}

// export interface TrainingMetrics {
//   accuracy: number;
//   precision: number;
//   recall: number;
//   f1Score: number;
//   // Chart data
//   accuracyLossChart: { epoch: number; accuracy: number; loss: number }[];
//   confusionMatrixChart: { name: string; value: number }[];
// }

// export interface SimulationResult {
//   timestamp: string;
//   sampleId: string;
//   prediction: 'Pass' | 'Fail' | 'Error';
//   confidenceScore: number;
//   temperature: number;
//   pressure: number;
//   humidity: number;
// }

// --- Stage 3 ---

// Model for the response when starting the training task
export interface TrainingStartResponse {
  task_id: string;
}

// Sub-models for the final training result payload
export interface Metrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface ChartDataPoint {
  x: number; // epoch
  y: number; // value
}

export interface TrainingChart {
  train_loss: ChartDataPoint[];
  train_accuracy: ChartDataPoint[];
}

export interface ConfusionMatrix {
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
}

export interface TrainingResult {
  metrics: Metrics;
  training_chart: TrainingChart;
  confusion_matrix: ConfusionMatrix;
  model_path: string;
  curves_path: string;
}

// Model for simple progress updates (e.g., 'Training model...')
export interface TrainingProgress {
  status: string;
}

// The main model for the status polling response
export interface TrainingStatusResponse {
  task_id: string;
  status: 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE' | 'REVOKED';
  progress: TrainingProgress | null;
  result: TrainingResult | null;
}

// --- Stage 4 ---

// --- Models for starting and stopping the simulation ---
export interface SimulationStartResponse {
  task_id: string;
}

export interface SimulationStopResponse {
  task_id: string;
  message: string;
}

// --- Sub-models for the real-time data packet ---
export interface LivePredictionData {
  timestamp: string; // ISO 8601 string
  sample_id: string;
  prediction: 'Pass' | 'Fail';
  confidence: number; // This is the Quality Score (0-100)
  top_features: { [key: string]: number };
}

export interface LiveStatistics {
  total_predictions: number;
  pass_count: number;
  fail_count: number;
  average_confidence: number;
}

// --- The two possible shapes for the 'progress' field ---
export interface SimulationDataPacket {
  current_row_index: number;
  total_rows: number;
  quality_score: number;
  live_prediction: LivePredictionData;
  live_stats: LiveStatistics;
}

export interface SimpleStatusProgress {
  status: string;
}

// --- Main model for the status polling response ---
export interface SimulationStatusResponse {
  task_id: string;
  status: 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE' | 'REVOKED';
  progress: SimulationDataPacket | SimpleStatusProgress | null;
  result: { message: string } | { error: string } | null;
}
