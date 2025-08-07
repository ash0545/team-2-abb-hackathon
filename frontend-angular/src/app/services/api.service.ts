import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  DatasetMetadata,
  DateRanges,
  DateRangeValidationResponse,
  DataSplitResponse,
  TrainingStartResponse,
  TrainingStatusResponse,
  SimulationStartResponse,
  SimulationStatusResponse,
  SimulationStopResponse,
} from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  /**
   * Uploads a dataset file to the backend for processing.
   * @param file The CSV file to upload.
   * @returns An Observable of the processed dataset metadata.
   */
  uploadDataset(file: File): Observable<DatasetMetadata> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    // FIX 2: The post URL is now correctly constructed by combining the base apiUrl
    // with the specific endpoint path.
    return this.http
      .post<DatasetMetadata>(`${this.apiUrl}/dataset/upload`, formData)
      .pipe(catchError(this.handleError));
  }

  // --- Stage 2 ---

  validateDateRanges(
    ranges: DateRanges
  ): Observable<DateRangeValidationResponse> {
    return this.http
      .post<DateRangeValidationResponse>(
        `${this.apiUrl}/dataset/validate-ranges`,
        ranges
      )
      .pipe(catchError(this.handleError));
  }

  splitData(ranges: DateRanges): Observable<DataSplitResponse> {
    return this.http
      .post<DataSplitResponse>(`${this.apiUrl}/dataset/split-data`, ranges)
      .pipe(catchError(this.handleError));
  }

  // --- Stage 3 ---

  /**
   * Sends a request to start the model training task.
   * @returns An Observable containing the task ID for polling.
   */
  startTraining(): Observable<TrainingStartResponse> {
    return this.http
      .post<TrainingStartResponse>(`${this.apiUrl}/training/start`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Polls the backend for the status of a specific training task.
   * @param task_id The ID of the task to check.
   * @returns An Observable with the current status, progress, and eventual result.
   */
  getTrainingStatus(task_id: string): Observable<TrainingStatusResponse> {
    return this.http
      .get<TrainingStatusResponse>(`${this.apiUrl}/training/status/${task_id}`)
      .pipe(catchError(this.handleError));
  }

  // --- Stage 4 ---

  /**
   * Sends a request to start the real-time simulation task.
   */
  startSimulation(): Observable<SimulationStartResponse> {
    return this.http
      .post<SimulationStartResponse>(`${this.apiUrl}/simulation/start`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Sends a request to stop (revoke) a running simulation task.
   */
  stopSimulation(taskId: string): Observable<SimulationStopResponse> {
    return this.http
      .post<SimulationStopResponse>(
        `${this.apiUrl}/simulation/stop/${taskId}`,
        {}
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Polls the backend for the status of a specific simulation task.
   */
  getSimulationStatus(taskId: string): Observable<SimulationStatusResponse> {
    return this.http
      .get<SimulationStatusResponse>(
        `${this.apiUrl}/simulation/status/${taskId}`
      )
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side errors
      // The backend should return a meaningful error message.
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = `Server returned code: ${error.status}, error message is: ${error.message}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
