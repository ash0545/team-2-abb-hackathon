import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/layout/header/header.component';
import { FooterComponent } from './components/layout/footer/footer.component';
import { Step1UploadComponent } from './components/steps/step1-upload/step1-upload.component';
import { Step2DateRangesComponent } from './components/steps/step2-date-ranges/step2-date-ranges.component';
import { Step3TrainingComponent } from './components/steps/step3-training/step3-training.component';
import { Step4SimulationComponent } from './components/steps/step4-simulation/step4-simulation.component';

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
  currentStep = 1;  // 👈 SET THIS TO 1
  steps = [
    { id: 1, title: 'Upload Dataset', isActive: true, isCompleted: false },
    { id: 2, title: 'Date Range', isActive: false, isCompleted: false},
    { id: 3, title: 'Train Model', isActive: false, isCompleted: false },
    { id: 4, title: 'Simulation', isActive: false, isCompleted: false }
  ];

  dateRanges: any;

  constructor() {
    console.log('🚀 AppComponent constructor loaded');
  }

  onDatasetUploaded(metadata: any) {
    console.log('📥 Dataset uploaded:', metadata);
    this.steps[0].isCompleted = true;
    this.steps[0].isActive = false;
    this.steps[1].isActive = true;
    this.currentStep = 2;
  }

  onDateRangesSet(ranges: any) {
    console.log('📆 Date ranges set:', ranges);
    this.dateRanges = ranges;
    this.steps[1].isCompleted = true;
    this.steps[1].isActive = false;
    this.steps[2].isActive = true;
    this.currentStep = 3;
  }

  onModelTrained() {
    console.log('🧠 Model trained');
    this.steps[2].isCompleted = true;
    this.steps[2].isActive = false;
    this.steps[3].isActive = true;
    this.currentStep = 4;
  }

  handleRestart() {
    console.log('🔄 Restarting process');
    this.currentStep = 1;
    this.steps.forEach((step, index) => {
      step.isActive = index === 0;
      step.isCompleted = false;
    });
    this.dateRanges = null;
  }
}
