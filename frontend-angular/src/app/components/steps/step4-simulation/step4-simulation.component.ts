import {
  Component,
  EventEmitter,
  Output,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Subscription, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';
import {
  LivePredictionData,
  LiveStatistics,
  SimulationDataPacket,
} from '../../../models/api.models';
import {
  Chart,
  registerables,
  TimeScale,
  LinearScale,
  PointElement,
  LineController,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(
  ...registerables,
  TimeScale,
  LinearScale,
  PointElement,
  LineController
);

@Component({
  selector: 'app-step4-simulation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step4-simulation.component.html',
  styleUrls: ['./step4-simulation.component.scss'],
})
export class Step4SimulationComponent implements AfterViewInit, OnDestroy {
  @Output() restart = new EventEmitter<void>();

  @ViewChild('qualityChart') qualityChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('confidenceChart')
  confidenceChartCanvas!: ElementRef<HTMLCanvasElement>;

  // --- State Management ---
  isSimulating = false;
  isCompleted = false;
  error: string | null = null;
  statusMessage = 'Ready to Simulate';

  // --- UI Data ---
  liveStats: LiveStatistics | null = null;
  livePredictions: LivePredictionData[] = [];
  topFeatureNames: string[] = [];

  private currentTaskId: string | null = null;
  private pollingSub: Subscription | undefined;
  private lastProcessedIndex = -1;
  private qualityChart: Chart | undefined;
  private confidenceChart: Chart | undefined;
  private viewInitialized = false;
  private pendingData: SimulationDataPacket[] = []; // Queue for data received before view init

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.viewInitialized = true;
    // Process any data that came in before view was ready
    if (this.pendingData.length > 0) {
      this.pendingData.forEach((data) => this.updateUI(data));
      this.pendingData = [];
    }
  }

  startSimulation() {
    this.resetState();
    this.isSimulating = true;
    this.statusMessage = 'Requesting simulation start...';

    this.apiService.startSimulation().subscribe({
      next: (response) => {
        this.currentTaskId = response.task_id;
        this.pollForStatus(response.task_id);
      },
      error: (err) => {
        this.isSimulating = false;
        this.error = `Failed to start simulation: ${err.message}`;
      },
    });
  }

  stopSimulation() {
    if (!this.currentTaskId) return;
    this.apiService.stopSimulation(this.currentTaskId).subscribe(() => {
      this.statusMessage = 'Stop signal sent, waiting for confirmation...';
    });
  }

  private pollForStatus(taskId: string) {
    this.pollingSub = timer(0, 500) // Poll faster than the backend produces data
      .pipe(
        switchMap(() => this.apiService.getSimulationStatus(taskId)),
        takeWhile(
          (res) => !['SUCCESS', 'FAILURE', 'REVOKED'].includes(res.status),
          true
        )
      )
      .subscribe({
        next: (response) => {
          if (response.status === 'PROGRESS' && response.progress) {
            // Check if it's a full data packet or a simple status message
            if ('current_row_index' in response.progress) {
              const dataPacket = response.progress as SimulationDataPacket;
              // Only update UI if it's a new row
              if (dataPacket.current_row_index > this.lastProcessedIndex) {
                this.lastProcessedIndex = dataPacket.current_row_index;
                this.statusMessage = `Processing ${
                  dataPacket.current_row_index + 1
                } of ${dataPacket.total_rows}`;
                // Handle data based on view state
                if (this.viewInitialized) {
                  this.updateUI(dataPacket);
                } else {
                  this.pendingData.push(dataPacket);
                }
              }
            } else {
              // It's a simple status message (e.g., warmup)
              this.statusMessage = response.progress.status;
            }
          } else if (response.status === 'SUCCESS') {
            this.isSimulating = false;
            this.isCompleted = true;
          } else if (response.status === 'REVOKED') {
            this.isSimulating = false;
            this.statusMessage = 'Simulation stopped by user.';
          } else if (response.status === 'FAILURE') {
            this.isSimulating = false;
            this.error = `Simulation failed.`;
          }
        },
        error: (err) => {
          this.isSimulating = false;
          this.error = `An error occurred while polling: ${err.message}`;
        },
      });
  }

  private updateUI(data: SimulationDataPacket) {
    console.log('Updating UI with data:', data);
    console.log('Quality chart exists:', !!this.qualityChart);
    console.log('Confidence chart exists:', !!this.confidenceChart);
    console.log('Live stats:', this.liveStats);

    // Ensure view is initialized before trying to create charts
    if (!this.viewInitialized) {
      this.pendingData.push(data);
      return;
    }

    // Create charts if they don't exist and canvas elements are available
    if (!this.qualityChart && this.qualityChartCanvas?.nativeElement) {
      this.createQualityChart();
    }
    if (!this.confidenceChart && this.confidenceChartCanvas?.nativeElement) {
      this.createConfidenceChart();
    }
    if (this.topFeatureNames.length === 0) {
      this.topFeatureNames = Object.keys(data.live_prediction.top_features);
    }

    // 1. Update Stats
    this.liveStats = data.live_stats;

    // 2. Update Live Table
    this.livePredictions.unshift(data.live_prediction);
    if (this.livePredictions.length > 20) this.livePredictions.pop();

    // 3. Update Quality Chart
    const qualityChartData = this.qualityChart?.data.datasets[0].data as {
      x: number;
      y: number;
    }[];
    qualityChartData.push({
      x: new Date(data.live_prediction.timestamp).getTime(),
      y: data.quality_score,
    });
    if (qualityChartData.length > 30) qualityChartData.shift();
    this.qualityChart?.update();

    // 4. Update Confidence Chart
    this.confidenceChart!.data.datasets[0].data = [
      data.live_stats.pass_count,
      data.live_stats.fail_count,
    ];
    this.confidenceChart?.update();

    // 5. Manually trigger change detection
    this.cdr.detectChanges();
  }

  restartProcess() {
    this.restart.emit();
  }

  private resetState() {
    this.pollingSub?.unsubscribe();
    this.isSimulating = false;
    this.isCompleted = false;
    this.error = null;
    this.currentTaskId = null;
    this.lastProcessedIndex = -1;
    this.livePredictions = [];
    this.liveStats = null;
    this.topFeatureNames = [];
    this.pendingData = [];

    // Destroy charts safely
    if (this.qualityChart) {
      this.qualityChart.destroy();
      this.qualityChart = undefined;
    }
    if (this.confidenceChart) {
      this.confidenceChart.destroy();
      this.confidenceChart = undefined;
    }
  }

  private createQualityChart() {
    // Double-check canvas availability
    if (!this.qualityChartCanvas?.nativeElement) {
      console.warn('Quality chart canvas not available');
      return;
    }

    const ctx = this.qualityChartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2d context for quality chart');
      return;
    }
    this.qualityChart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Quality Score',
            data: [],
            borderColor: 'hsl(217, 91%, 60%)',
            tension: 0.2,
            fill: false,
            pointRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: { unit: 'second', displayFormats: { second: 'HH:mm:ss' } },
          },
          y: { min: 0, max: 100 },
        },
      },
    });
  }

  private createConfidenceChart() {
    // Double-check canvas availability
    if (!this.confidenceChartCanvas?.nativeElement) {
      console.warn('Confidence chart canvas not available');
      return;
    }

    const ctx = this.confidenceChartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2d context for confidence chart');
      return;
    }
    this.confidenceChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pass', 'Fail'],
        datasets: [
          {
            data: [0, 0],
            backgroundColor: ['hsl(142, 71%, 45%)', 'hsl(0, 84%, 60%)'],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  ngOnDestroy() {
    this.resetState();
  }
}
