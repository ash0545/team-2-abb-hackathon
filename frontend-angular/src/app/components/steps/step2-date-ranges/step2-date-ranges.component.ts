import {
  Component,
  EventEmitter,
  Output,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import {
  DateRanges,
  DateRangeValidationResponse,
  DataSplitResponse,
} from '../../../models/api.models';
import { finalize } from 'rxjs/operators';
import {
  Chart,
  registerables,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js';

Chart.register(
  ...registerables,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip
);

@Component({
  selector: 'app-step2-date-ranges',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step2-date-ranges.component.html',
  styleUrls: ['./step2-date-ranges.component.scss'],
})
export class Step2DateRangesComponent {
  @Output() dateRangesSet = new EventEmitter<DateRanges>();
  @ViewChild('dailyDistChart')
  dailyDistChartCanvas!: ElementRef<HTMLCanvasElement>;

  ranges: DateRanges = {
    trainStart: '',
    trainEnd: '',
    testStart: '',
    testEnd: '',
    simulationStart: '',
    simulationEnd: '',
  };

  isValidating = false;
  isSplitting = false;
  validationResponse: DateRangeValidationResponse | null = null;
  splitResponse: DataSplitResponse | null = null;
  error: string | null = null;
  private chart: Chart | undefined;

  constructor(private apiService: ApiService) {}
  // // Helper function to convert a YYYY-MM-DD date string to a full ISO string at the start of that day in UTC.
  // private toUtcIsoString(dateString: string): string {
  //   if (!dateString) return '';
  //   // new Date('YYYY-MM-DD') creates a date at midnight in the LOCAL timezone.
  //   // We convert this to an ISO string, which will be in UTC.
  //   return new Date(dateString).toISOString();
  // }

  // // A new model to hold the UTC-converted dates for sending
  // private getUtcRanges(): DateRanges {
  //   return {
  //     trainStart: this.toUtcIsoString(this.ranges.trainStart),
  //     trainEnd: this.toUtcIsoString(this.ranges.trainEnd),
  //     testStart: this.toUtcIsoString(this.ranges.testStart),
  //     testEnd: this.toUtcIsoString(this.ranges.testEnd),
  //     simulationStart: this.toUtcIsoString(this.ranges.simulationStart),
  //     simulationEnd: this.toUtcIsoString(this.ranges.simulationEnd),
  //   };
  // }

  validateRanges() {
    this.isValidating = true;
    this.error = null;
    this.validationResponse = null;
    this.splitResponse = null; // Reset previous results
    if (this.chart) this.chart.destroy();

    // ❗ ADDED CONSOLE LOG
    // This will show the exact data being sent in the network request.
    console.log(
      '🚀 Sending to .NET backend for validation:',
      JSON.stringify(this.ranges, null, 2)
    );

    this.apiService
      .validateDateRanges(this.ranges)
      .pipe(finalize(() => (this.isValidating = false)))
      .subscribe({
        next: (response) => {
          this.validationResponse = response;
          if (response.status !== 'Valid') {
            this.error = response.message;
          }
        },
        error: (err) => {
          this.error = err.message;
        },
      });
  }

  proceedToNextStep() {
    if (this.validationResponse?.status !== 'Valid') return;

    this.isSplitting = true;
    this.error = null;

    this.apiService
      .splitData(this.ranges)
      .pipe(finalize(() => (this.isSplitting = false)))
      .subscribe({
        next: (response) => {
          this.splitResponse = response;
          this.createDailyDistChart(); // Create chart with data and colors
          // Wait a moment for chart to render before emitting
          setTimeout(() => this.dateRangesSet.emit(this.ranges), 100);
        },
        error: (err) => {
          this.error = err.message;
        },
      });
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

  private createDailyDistChart() {
    const distributionData = this.splitResponse?.dailyDistribution;
    if (!distributionData) return;

    setTimeout(() => {
      const ctx = this.dailyDistChartCanvas.nativeElement.getContext('2d');
      if (!ctx) return;

      if (this.chart) {
        this.chart.destroy();
      }

      const sortedLabels = Object.keys(distributionData).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );
      const data = sortedLabels.map((label) => distributionData[label]);

      const backgroundColors = sortedLabels.map((label) => {
        const date = new Date(label);
        if (
          date >= new Date(this.ranges.trainStart) &&
          date <= new Date(this.ranges.trainEnd)
        )
          return 'rgba(40, 167, 69, 0.7)'; // Green
        if (
          date >= new Date(this.ranges.testStart) &&
          date <= new Date(this.ranges.testEnd)
        )
          return 'rgba(255, 193, 7, 0.7)'; // Orange
        if (
          date >= new Date(this.ranges.simulationStart) &&
          date <= new Date(this.ranges.simulationEnd)
        )
          return 'rgba(0, 123, 255, 0.7)'; // Blue
        return 'rgba(200, 200, 200, 0.4)';
      });

      const borderColors = backgroundColors.map((c) => c.replace('0.6', '1'));

      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sortedLabels,
          datasets: [
            {
              label: 'Record Count',
              data: data,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } },
          plugins: { legend: { display: false } },
        },
      });
    }, 0);
  }
}
