import { Component, EventEmitter, Output, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { DateRanges, DateRangeValidationResponse } from '../../../models/api.models';
import { finalize } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-step2-date-ranges',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step2-date-ranges.component.html',
  styleUrls: ['./step2-date-ranges.component.scss']
})
export class Step2DateRangesComponent {
  @Output() dateRangesSet = new EventEmitter<DateRanges>();
  @ViewChild('monthlyDistChart') monthlyDistChartCanvas!: ElementRef<HTMLCanvasElement>;

  ranges: DateRanges = {
    trainStart: '2022-01-01',
    trainEnd: '2022-09-30',
    testStart: '2022-10-01',
    testEnd: '2022-11-30',
    simulationStart: '2022-12-01',
    simulationEnd: '2022-12-31'
  };

  isValidating = false;
  validationResponse: DateRangeValidationResponse | null = null;
  error: string | null = null;
  private chart: Chart | undefined;

  constructor(private apiService: ApiService) {}

  validateRanges() {
  this.validationResponse = {
    status: 'Valid',
    message: 'Valid ranges.',
    trainRecordCount: 50000,
    testRecordCount: 20000,
    simulationRecordCount: 10000,
    trainDurationDays: 273,
    testDurationDays: 61,
    simulationDurationDays: 31,
    monthlyDistribution: {
      'Jan': 5000,
      'Feb': 4500,
      'Mar': 4700,
      'Apr': 4300,
      'May': 4000,
      'Jun': 4100,
      'Jul': 4600,
      'Aug': 4800,
      'Sep': 4500,
      'Oct': 3000,
      'Nov': 3000,
      'Dec': 3000
    }
  };
  this.createMonthlyDistChart();
}

  proceedToNextStep() {
    if (this.validationResponse?.status === 'Valid') {
      this.dateRangesSet.emit(this.ranges);
    }
  }

  private createMonthlyDistChart() {
    // Assign the distribution to a const to help TypeScript's type inference
    const distributionData = this.validationResponse?.monthlyDistribution;

    // FIX: Use the new const for the null check
    if (!distributionData) {
      return;
    }
    
    setTimeout(() => {
      const ctx = this.monthlyDistChartCanvas.nativeElement.getContext('2d');
      if (!ctx) return;

      if (this.chart) {
        this.chart.destroy();
      }

      // FIX: Use the non-null const for chart data creation
      const labels = Object.keys(distributionData).sort();
      const data = labels.map(label => distributionData[label]);

      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Record Count',
            data: data,
            backgroundColor: 'hsla(var(--primary), 0.6)',
            borderColor: 'hsl(var(--primary))',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } },
          plugins: { legend: { display: false } }
        }
      });
    }, 0);
  }
}
