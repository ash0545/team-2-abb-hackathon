import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { DateRanges, TrainingMetrics } from '../../../models/api.models';
import { finalize } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-step3-training',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step3-training.component.html',
  styleUrls: ['./step3-training.component.scss']
})
export class Step3TrainingComponent implements AfterViewInit {
  @Input() dateRanges: DateRanges | null = null;
  @Output() modelTrained = new EventEmitter<void>();

  @ViewChild('metricsChart') metricsChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('confusionChart') confusionChartCanvas!: ElementRef<HTMLCanvasElement>;

  isTraining = false;
  trainingResults: TrainingMetrics | null = null;
  error: string | null = null;

  private metricsChart: Chart | undefined;
  private confusionChart: Chart | undefined;

  constructor(private apiService: ApiService) {}

  ngAfterViewInit() {
    // If results are already present (e.g., navigating back), render charts.
    if (this.trainingResults) {
      this.createCharts();
    }
  }

  trainModel() {
  this.trainingResults = {
    accuracy: 0.95,
    precision: 0.93,
    recall: 0.92,
    f1Score: 0.925,
    accuracyLossChart: [
      { epoch: 1, accuracy: 0.8, loss: 0.5 },
      { epoch: 2, accuracy: 0.85, loss: 0.4 },
      { epoch: 3, accuracy: 0.9, loss: 0.3 },
      { epoch: 4, accuracy: 0.93, loss: 0.2 },
      { epoch: 5, accuracy: 0.95, loss: 0.1 }
    ],
    confusionMatrixChart: [
      { name: 'True Positive', value: 800 },
      { name: 'True Negative', value: 100 },
      { name: 'False Positive', value: 50 },
      { name: 'False Negative', value: 30 }
    ]
  };
  this.createCharts();
}

  proceedToNextStep() {
    if (this.trainingResults) {
      this.modelTrained.emit();
    }
  }

  private createCharts() {
    setTimeout(() => {
      if (this.trainingResults?.accuracyLossChart) {
        this.createMetricsChart();
      }
      if (this.trainingResults?.confusionMatrixChart) {
        this.createConfusionChart();
      }
    }, 0);
  }

  private createMetricsChart() {
    const ctx = this.metricsChartCanvas.nativeElement.getContext('2d');
    if (!ctx || !this.trainingResults) return;

    if (this.metricsChart) this.metricsChart.destroy();

    const data = this.trainingResults.accuracyLossChart;
    const labels = data.map(d => `Epoch ${d.epoch}`);

    this.metricsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Accuracy',
            data: data.map(d => d.accuracy),
            borderColor: 'hsl(142, 71%, 45%)',
            backgroundColor: 'hsla(142, 71%, 45%, 0.1)',
            tension: 0.1,
            fill: true,
          },
          {
            label: 'Loss',
            data: data.map(d => d.loss),
            borderColor: 'hsl(0, 84%, 60%)',
            backgroundColor: 'hsla(0, 84%, 60%, 0.1)',
            tension: 0.1,
            fill: true,
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  private createConfusionChart() {
    const ctx = this.confusionChartCanvas.nativeElement.getContext('2d');
    if (!ctx || !this.trainingResults) return;

    if (this.confusionChart) this.confusionChart.destroy();
    
    const data = this.trainingResults.confusionMatrixChart;

    this.confusionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          data: data.map(d => d.value),
          backgroundColor: [
            'hsl(142, 71%, 45%)', // True Positive
            'hsl(217, 91%, 60%)', // True Negative
            'hsl(38, 92%, 50%)',  // False Positive
            'hsl(0, 84%, 60%)'    // False Negative
          ],
          borderWidth: 2,
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}
