import { Injectable } from '@angular/core';
import { Observable, of, interval } from 'rxjs';
import { delay, map, take } from 'rxjs/operators';
import { DatasetMetadata, DateRanges, DateRangeValidationResponse, TrainingMetrics, SimulationResult } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor() { }

  uploadDataset(file: File): Observable<DatasetMetadata> {
    console.log('Mocking dataset upload for:', file.name);
    const mockMetadata: DatasetMetadata = {
      numberOfRecords: 15230,
      numberOfColumns: 7,
      passRatePercentage: 75.5,
      firstTimestamp: new Date('2022-01-01T00:00:00Z').toISOString(),
      lastTimestamp: new Date('2022-12-31T23:59:59Z').toISOString(),
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    };
    // Simulate a 1.5 second network delay
    return of(mockMetadata).pipe(delay(1500));
  }

  validateDateRanges(ranges: DateRanges): Observable<DateRangeValidationResponse> {
    console.log('Mocking date range validation for:', ranges);
    const mockResponse: DateRangeValidationResponse = {
      status: 'Valid',
      message: 'Date ranges validated successfully!',
      trainRecordCount: 10500,
      testRecordCount: 3500,
      simulationRecordCount: 1230,
      trainDurationDays: 272,
      testDurationDays: 60,
      simulationDurationDays: 30,
      monthlyDistribution: {
        '2022-01': 1200, '2022-02': 1100, '2022-03': 1300, '2022-04': 1250,
        '2022-05': 1400, '2022-06': 1350, '2022-07': 1450, '2022-08': 1400,
        '2022-09': 1700, '2022-10': 1800, '2022-11': 1750, '2022-12': 1230
      }
    };
    return of(mockResponse).pipe(delay(1000));
  }

  trainModel(ranges: DateRanges): Observable<TrainingMetrics> {
    console.log('Mocking model training...');
    const mockMetrics: TrainingMetrics = {
      accuracy: 94.2,
      precision: 92.8,
      recall: 91.5,
      f1Score: 92.1,
      accuracyLossChart: Array.from({ length: 20 }, (_, i) => ({
        epoch: i + 1,
        accuracy: 85 + (i * 0.5) - (Math.random() * 2),
        loss: 1.2 - (i * 0.04) + (Math.random() * 0.1)
      })),
      confusionMatrixChart: [
        { name: 'True Positive', value: 850 },
        { name: 'True Negative', value: 100 },
        { name: 'False Positive', value: 30 },
        { name: 'False Negative', value: 20 }
      ]
    };
    return of(mockMetrics).pipe(delay(3000));
  }

  startSimulation(ranges: DateRanges): Observable<SimulationResult> {
    console.log('Starting mock simulation...');
    // Use RxJS 'interval' to emit a value every second
    return interval(1000).pipe(
      take(30), // Emit 30 mock results
      map(i => {
        const isPass = Math.random() > 0.15;
        const now = new Date();
        now.setSeconds(now.getSeconds() + i);
        
        const mockResult: SimulationResult = {
          timestamp: now.toISOString(),
          sampleId: `MOCK_${String(i + 1).padStart(3, '0')}`,
          prediction: isPass ? 'Pass' : 'Fail',
          confidenceScore: Math.floor(Math.random() * 30) + 70,
          temperature: +(25 + (Math.random() * 5 - 2.5)).toFixed(1),
          pressure: +(1012 + (Math.random() * 10 - 5)).toFixed(1),
          humidity: +(60 + (Math.random() * 10 - 5)).toFixed(1)
        };
        return mockResult;
      })
    );
  }
}
