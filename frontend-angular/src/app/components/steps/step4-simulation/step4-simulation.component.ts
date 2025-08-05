import { Component, EventEmitter, Input, Output, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { DateRanges, SimulationResult } from '../../../models/api.models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-step4-simulation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step4-simulation.component.html',
  styleUrls: ['./step4-simulation.component.scss']
})
export class Step4SimulationComponent implements OnDestroy {
  @Input() dateRanges: DateRanges | null = null;
  @Output() restart = new EventEmitter<void>();

  @ViewChild('qualityChart') qualityChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('confidenceChart') confidenceChartCanvas!: ElementRef<HTMLCanvasElement>;

  isSimulating = false;
  isCompleted = false;
  error: string | null = null;
  
  predictions: SimulationResult[] = [];
  stats = { total: 0, pass: 0, fail: 0, avgConfidence: 0 };
  
  private simulationSub: Subscription | null = null;
  private qualityChart: Chart | undefined;
  private confidenceChart: Chart | undefined;

  constructor(private apiService: ApiService) {}

  startSimulation() {
  this.resetState();
  this.isSimulating = true;

  const dummyResults: SimulationResult[] = [
    { timestamp: new Date().toISOString(), sampleId: 'S001', prediction: 'Pass', confidenceScore: 92, temperature: 25, pressure: 1.2, humidity: 60 },
    { timestamp: new Date().toISOString(), sampleId: 'S002', prediction: 'Fail', confidenceScore: 75, temperature: 26, pressure: 1.1, humidity: 62 }
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i >= dummyResults.length) {
      clearInterval(interval);
      this.isSimulating = false;
      this.isCompleted = true;
      return;
    }
    const result = dummyResults[i++];
    this.updatePredictions(result);
    this.updateStats(result);
    this.updateCharts();
  }, 1000);
}

  restartSimulation() {
    this.restart.emit();
  }

  private resetState() {
    this.isSimulating = false;
    this.isCompleted = false;
    this.error = null;
    this.predictions = [];
    this.stats = { total: 0, pass: 0, fail: 0, avgConfidence: 0 };
    if (this.qualityChart) this.qualityChart.destroy();
    if (this.confidenceChart) this.confidenceChart.destroy();
  }

  private updatePredictions(result: SimulationResult) {
    this.predictions.unshift(result);
    if (this.predictions.length > 10) {
      this.predictions.pop();
    }
  }

  private updateStats(result: SimulationResult) {
    const newTotal = this.stats.total + 1;
    const newPass = this.stats.pass + (result.prediction === 'Pass' ? 1 : 0);
    const newFail = this.stats.fail + (result.prediction === 'Fail' ? 1 : 0);
    const newAvgConf = Math.round(((this.stats.avgConfidence * this.stats.total) + result.confidenceScore) / newTotal);

    this.stats = {
      total: newTotal,
      pass: newPass,
      fail: newFail,
      avgConfidence: newAvgConf
    };
  }

  private updateCharts() {
    // Lazy initialize charts on first data update
    if (!this.qualityChart) this.createQualityChart();
    if (!this.confidenceChart) this.createConfidenceChart();

    // Update Quality Chart
    const qualityScore = this.predictions[0].prediction === 'Pass' ? 
      Math.floor(Math.random() * 20) + 80 : 
      Math.floor(Math.random() * 40) + 30;
    
    this.qualityChart?.data.labels?.push(new Date(this.predictions[0].timestamp).toLocaleTimeString());
    (this.qualityChart?.data.datasets[0].data as number[]).push(qualityScore);

    if (this.qualityChart!.data.labels!.length > 20) {
      this.qualityChart?.data.labels?.shift();
      (this.qualityChart?.data.datasets[0].data as number[]).shift();
    }
    this.qualityChart?.update();

    // Update Confidence Chart
    this.confidenceChart!.data.datasets[0].data = [this.stats.pass, this.stats.fail];
    this.confidenceChart?.update();
  }

  private createQualityChart() {
    const ctx = this.qualityChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    this.qualityChart = new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [{
        label: 'Quality Score', data: [],
        borderColor: 'hsl(217, 91%, 60%)', tension: 0.1, fill: false
      }]},
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }
    });
  }

  private createConfidenceChart() {
    const ctx = this.confidenceChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    this.confidenceChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pass', 'Fail'],
        datasets: [{ data: [0, 0], backgroundColor: ['hsl(142, 71%, 45%)', 'hsl(0, 84%, 60%)'] }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  ngOnDestroy() {
    this.simulationSub?.unsubscribe();
  }
}
