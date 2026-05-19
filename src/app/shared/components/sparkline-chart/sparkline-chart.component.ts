import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sparkline-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sparkline-chart.component.html'
})
export class SparklineChartComponent implements OnChanges {
  @Input() data: { date: string; revenue: number }[] = [];
  @Input() label = 'Revenue';

  viewBox = '0 0 400 100';
  areaPath = '';
  linePoints = '';
  xLabels: string[] = [];
  yLabels: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.computePaths();
    }
  }

  private computePaths() {
    const w = 400;
    const h = 100;
    const padding = 6;
    const values = (this.data || []).map(d => Number(d.revenue || 0));
    this.xLabels = (this.data || []).map(d => this.formatDayLabel(d.date));
    if (values.length === 0) {
      this.areaPath = '';
      this.linePoints = '';
      this.yLabels = [];
      return;
    }
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const mid = Math.round(min + (range / 2));
    this.yLabels = [max, mid, min];

    const step = w / Math.max(1, values.length - 1);

    const points: { x: number; y: number }[] = values.map((v, i) => {
      const x = Math.round(i * step);
      const y = Math.round(h - padding - ((v - min) / range) * (h - padding * 2));
      return { x, y };
    });

    // Build area path
    const areaParts: string[] = [];
    areaParts.push(`M ${points[0].x} ${h - padding}`);
    for (const p of points) {
      areaParts.push(`L ${p.x} ${p.y}`);
    }
    areaParts.push(`L ${points[points.length - 1].x} ${h - padding}`);
    areaParts.push('Z');
    this.areaPath = areaParts.join(' ');

    // Build polyline points
    this.linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  private formatDayLabel(date: string): string {
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return date;
    }
    return parsed.toLocaleDateString('en-US', { weekday: 'short' });
  }
}
