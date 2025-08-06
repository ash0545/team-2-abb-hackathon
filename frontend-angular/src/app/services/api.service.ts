import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  DatasetMetadata,
  DateRanges,
  DateRangeValidationResponse,
  TrainingStartResponse,
  TrainingStatusResponse,
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

  /**
   * Validates the date ranges for training, testing, and simulation.
   * @param ranges Object containing 3 date ranges.
   * @returns Validation summary and monthly distribution.
   */
  validateDateRanges(
    ranges: DateRanges
  ): Observable<DateRangeValidationResponse> {
    return this.http
      .post<DateRangeValidationResponse>(
        `${this.apiUrl}/dataset/validate-date-ranges`,
        ranges
      )
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
