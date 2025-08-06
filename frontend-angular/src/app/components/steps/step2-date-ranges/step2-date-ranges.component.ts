import { Component, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
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
    trainStart: '',
    trainEnd: '',
    testStart: '',
    testEnd: '',
    simulationStart: '',
    simulationEnd: ''
  };

  isValidating = false;
  validationResponse: DateRangeValidationResponse | null = null;
  error: string | null = null;
  private chart: Chart | undefined;

  constructor(private apiService: ApiService) {}

  validateRanges() {
    if (!this.isAllDatesProvided()) {
      this.error = 'All date ranges must be filled before validation.';
      return;
    }

    this.isValidating = true;
    this.error = null;

    this.apiService.validateDateRanges(this.ranges)
      .pipe(finalize(() => this.isValidating = false))
      .subscribe({
        next: (response) => {
          if (response.status === 'Valid') {
            this.validationResponse = response;
            this.createMonthlyDistChart();
          } else {
            this.validationResponse = null;
            this.error = response.message || 'Date ranges are not valid.';
          }
        },
        error: (err) => {
          this.error = 'Failed to validate date ranges.';
          console.error(err);
          this.validationResponse = null;
        }
      });
  }

  proceedToNextStep() {
    if (this.validationResponse?.status === 'Valid') {
      this.dateRangesSet.emit(this.ranges);
    }
  }

  private isAllDatesProvided(): boolean {
  const r = this.ranges;
  return Boolean(
    r.trainStart &&
    r.trainEnd &&
    r.testStart &&
    r.testEnd &&
    r.simulationStart &&
    r.simulationEnd
  );
}

  private createMonthlyDistChart() {
    const distributionData = this.validationResponse?.monthlyDistribution;
    if (!distributionData) return;

    setTimeout(() => {
      const ctx = this.monthlyDistChartCanvas.nativeElement.getContext('2d');
      if (!ctx) return;

      if (this.chart) {
        this.chart.destroy();
      }

      const labels = Object.keys(distributionData).sort();
      const data = labels.map(label => distributionData[label]);

      const backgroundColors = labels.map(label => {
        if (this.isInRange(label, this.ranges.trainStart, this.ranges.trainEnd)) return 'rgba(0, 128, 0, 0.6)';     // Green
        if (this.isInRange(label, this.ranges.testStart, this.ranges.testEnd)) return 'rgba(255, 165, 0, 0.6)';     // Orange
        if (this.isInRange(label, this.ranges.simulationStart, this.ranges.simulationEnd)) return 'rgba(30, 144, 255, 0.6)'; // Blue
        return 'rgba(200, 200, 200, 0.4)'; // fallback muted
      });

      const borderColors = backgroundColors.map(c => c.replace('0.6', '1'));

      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Record Count',
            data: data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
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

  private isInRange(monthLabel: string, startDate: string, endDate: string): boolean {
    const monthMap: { [key: string]: number } = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    const monthIndex = monthMap[monthLabel];
    if (monthIndex === undefined) return false;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const midMonth = new Date(start.getFullYear(), monthIndex, 15);

    return midMonth >= start && midMonth <= end;
  }
}
