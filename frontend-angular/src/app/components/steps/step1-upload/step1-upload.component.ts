import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { DatasetMetadata } from '../../../models/api.models';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-step1-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step1-upload.component.html',
  styleUrls: ['./step1-upload.component.scss'],
})
export class Step1UploadComponent {
  @Output() datasetUploaded = new EventEmitter<DatasetMetadata>();

  isDragOver = false;
  isUploading = false;
  metadata: DatasetMetadata | null = null;
  error: string | null = null;

  constructor(private apiService: ApiService) {
    console.log('✅ Step1UploadComponent is rendering!');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files?.length) this.handleFileUpload(files[0]);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.handleFileUpload(input.files[0]);
  }

  handleFileUpload(file: File): void {
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      this.error = 'Invalid file type. Please upload a CSV file.';
      return;
    }

    this.error = null;
    this.metadata = null;
    this.isUploading = true;

    this.apiService
      .uploadDataset(file)
      .pipe(finalize(() => (this.isUploading = false)))
      .subscribe({
        next: (responseMetadata) => {
          this.metadata = responseMetadata;
        },
        error: (err) => {
          this.error = err.message;
          this.metadata = null;
        },
      });
  }

  proceedToNextStep(): void {
    if (this.metadata) {
      console.log('📤 Emitting datasetUploaded:', this.metadata);
      this.datasetUploaded.emit(this.metadata);
    }
  }
}
