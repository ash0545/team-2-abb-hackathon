// This file contains all the data structures for API requests and responses.

export interface DatasetMetadata {
  numberOfRecords: number;
  numberOfColumns: number;
  passRatePercentage: number;
  firstTimestamp: string;
  lastTimestamp: string;
  // Frontend-specific additions
  fileName?: string;
  fileSize?: string;
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
