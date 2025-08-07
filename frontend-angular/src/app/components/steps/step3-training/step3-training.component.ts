import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { DateRanges, TrainingResult } from '../../../models/api.models';
import { Subscription, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-step3-training',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step3-training.component.html',
  styleUrls: ['./step3-training.component.scss'],
})
export class Step3TrainingComponent implements OnDestroy {
  @Input() dateRanges: DateRanges | null = null;
  @Output() modelTrained = new EventEmitter<void>();

  @ViewChild('metricsChart') metricsChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('confusionChart')
  confusionChartCanvas!: ElementRef<HTMLCanvasElement>;

  // --- State Management ---
  isTraining = false;
  trainingStatusMessage = '';
  trainingResults: TrainingResult | null = null;
  error: string | null = null;

  private pollingSubscription: Subscription | undefined;

  private metricsChart: Chart | undefined;
  private confusionChart: Chart | undefined;

  constructor(private apiService: ApiService) {}

  trainModel() {
    this.isTraining = true;
    this.trainingResults = null;
    this.error = null;
    this.trainingStatusMessage = 'Initiating training task...';

    this.apiService.startTraining().subscribe({
      next: (response) => {
        this.pollForStatus(response.task_id);
      },
      error: (err) => {
        this.isTraining = false;
        this.error = `Failed to start training: ${err.message}`;
      },
    });
  }

  private pollForStatus(task_id: string) {
    this.pollingSubscription = timer(0, 2000) // Poll every 2 seconds
      .pipe(
        switchMap(() => this.apiService.getTrainingStatus(task_id)),
        // Keep polling until a final state is reached
        takeWhile((res) => !['SUCCESS', 'FAILURE'].includes(res.status), true)
      )
      .subscribe({
        next: (response) => {
          if (response.status === 'PROGRESS' && response.progress) {
            this.trainingStatusMessage = response.progress.status;
          } else if (response.status === 'SUCCESS' && response.result) {
            this.isTraining = false;
            this.trainingResults = response.result;
            this.createCharts();
          } else if (response.status === 'FAILURE') {
            this.isTraining = false;
            this.error = `Training failed. Reason: ${
              response.progress?.status || 'Unknown error'
            }`;
          }
        },
        error: (err) => {
          this.isTraining = false;
          this.error = `An error occurred while polling: ${err.message}`;
        },
      });
  }

  proceedToNextStep() {
    if (this.trainingResults) {
      this.modelTrained.emit();
    }
  }

  private createCharts() {
    setTimeout(() => {
      if (this.trainingResults?.training_chart) {
        this.createMetricsChart();
      }
      if (this.trainingResults?.confusion_matrix) {
        this.createConfusionChart();
      }
    }, 0);
  }

  private createMetricsChart() {
    const ctx = this.metricsChartCanvas.nativeElement.getContext('2d');
    if (!ctx || !this.trainingResults) return;
    if (this.metricsChart) this.metricsChart.destroy();

    const chartData = this.trainingResults.training_chart;
    const labels = chartData.train_accuracy.map((d) => `Epoch ${d.x + 1}`);

    this.metricsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Accuracy',
            data: chartData.train_accuracy.map((d) => d.y),
            borderColor: 'hsl(142, 71%, 45%)',
            yAxisID: 'yAccuracy',
          },
          {
            label: 'Loss',
            data: chartData.train_loss.map((d) => d.y),
            borderColor: 'hsl(0, 84%, 60%)',
            yAxisID: 'yLoss',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAccuracy: { position: 'left' },
          yLoss: { position: 'right' },
        },
      },
    });
  }
  private createConfusionChart() {
    const ctx = this.confusionChartCanvas.nativeElement.getContext('2d');
    if (!ctx || !this.trainingResults) return;
    if (this.confusionChart) this.confusionChart.destroy();

    const data = this.trainingResults.confusion_matrix;

    this.confusionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [
          'True Positives',
          'True Negatives',
          'False Positives',
          'False Negatives',
        ],
        datasets: [
          {
            data: [
              data.true_positives,
              data.true_negatives,
              data.false_positives,
              data.false_negatives,
            ],
            backgroundColor: [
              'hsl(142, 71%, 45%)',
              'hsl(217, 91%, 60%)',
              'hsl(38, 92%, 50%)',
              'hsl(0, 84%, 60%)',
            ],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
  }
}
