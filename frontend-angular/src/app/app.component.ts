import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import all the necessary components
import { HeaderComponent, Step } from './components/layout/header/header.component';
import { FooterComponent } from './components/layout/footer/footer.component'; // <-- FIX: This line was missing
import { Step1UploadComponent } from './components/steps/step1-upload/step1-upload.component';
import { Step2DateRangesComponent } from './components/steps/step2-date-ranges/step2-date-ranges.component';
import { Step3TrainingComponent } from './components/steps/step3-training/step3-training.component';
import { Step4SimulationComponent } from './components/steps/step4-simulation/step4-simulation.component';

// Import the data models
import { DatasetMetadata, DateRanges } from './models/api.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    Step1UploadComponent,
    Step2DateRangesComponent,
    Step3TrainingComponent,
    Step4SimulationComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  currentStep = 1;
  datasetMetadata: DatasetMetadata | null = null;
  dateRanges: DateRanges | null = null;
  isModelTrained = false;

  steps: Step[] = [
    { id: 1, title: 'Upload Dataset', isCompleted: false, isActive: true },
    { id: 2, title: 'Date Ranges', isCompleted: false, isActive: false },
    { id: 3, title: 'Model Training', isCompleted: false, isActive: false },
    { id: 4, title: 'Simulation', isCompleted: false, isActive: false },
  ];

  constructor() {
    this.updateSteps();
  }

  updateSteps() {
    this.steps.forEach(step => {
      step.isActive = step.id === this.currentStep;
      step.isCompleted = step.id < this.currentStep;
    });
  }

  handleNext() {
    if (this.currentStep < 4) {
      this.currentStep++;
      this.updateSteps();
    }
  }
  
  handleRestart() {
    this.currentStep = 1;
    this.datasetMetadata = null;
    this.dateRanges = null;
    this.isModelTrained = false;
    this.updateSteps();
  }

  onDatasetUploaded(metadata: DatasetMetadata) {
    this.datasetMetadata = metadata;
    this.handleNext();
  }

  onDateRangesSet(ranges: DateRanges) {
    this.dateRanges = ranges;
    this.handleNext();
  }

  onModelTrained() {
    this.isModelTrained = true;
    this.handleNext();
  }
}
