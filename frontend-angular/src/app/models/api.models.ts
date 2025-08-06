// This file contains all the data structures for API requests and responses.

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
export interface DateRange {
  start: string;
  end: string;
}

export interface DateRanges {
  trainStart: string;
  trainEnd: string;
  testStart: string;
  testEnd: string;
  simulationStart: string;
  simulationEnd: string;
}

export interface DateRangeValidationResponse {
  status: 'Valid' | 'Invalid';
  message: string;
  trainRecordCount: number;
  testRecordCount: number;
  simulationRecordCount: number;
  trainDurationDays: number;
  testDurationDays: number;
  simulationDurationDays: number;
  monthlyDistribution: { [key: string]: number };
}

export interface TrainingMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  // Chart data
  accuracyLossChart: { epoch: number; accuracy: number; loss: number }[];
  confusionMatrixChart: { name: string; value: number }[];
}

export interface SimulationResult {
  timestamp: string;
  sampleId: string;
  prediction: 'Pass' | 'Fail' | 'Error';
  confidenceScore: number;
  temperature: number;
  pressure: number;
  humidity: number;
}

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
