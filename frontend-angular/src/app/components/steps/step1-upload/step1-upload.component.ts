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
  styleUrls: ['./step1-upload.component.scss']
})
export class Step1UploadComponent {
  @Output() datasetUploaded = new EventEmitter<DatasetMetadata>();

  isDragOver = false;
  isUploading = false;
  metadata: DatasetMetadata | null = null;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileUpload(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileUpload(input.files[0]);
    }
  }

 handleFileUpload(file: File) {
  this.error = null;
  this.metadata = {
    numberOfRecords: 100000,
    numberOfColumns: 15,
    passRatePercentage: 85.5,
    firstTimestamp: '2022-01-01T00:00:00Z',
    lastTimestamp: '2022-12-31T23:59:59Z',
    fileName: file.name,
    fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
  };
}

  proceedToNextStep() {
    if (this.metadata) {
      this.datasetUploaded.emit(this.metadata);
    }
  }
}
