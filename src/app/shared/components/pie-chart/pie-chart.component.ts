import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule, CurrencyIdrPipe],
  templateUrl: './pie-chart.component.html'
})
export class PieChartComponent implements OnChanges {
  @Input() segments: { category: string; amount: number; color: string; percent: number }[] = [];

  arcs: { d: string; color: string; category: string; amount: number; percent: number }[] = [];
  total = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['segments']) {
      this.computeArcs();
    }
  }

  private polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const angleRad = (angleDeg - 90) * Math.PI / 180.0;
    return {
      x: cx + (r * Math.cos(angleRad)),
      y: cy + (r * Math.sin(angleRad))
    };
  }

  private describeArcPath(cx: number, cy: number, rOuter: number, rInner: number, startAngle: number, endAngle: number) {
    const startOuter = this.polarToCartesian(cx, cy, rOuter, endAngle);
    const endOuter = this.polarToCartesian(cx, cy, rOuter, startAngle);
    const startInner = this.polarToCartesian(cx, cy, rInner, startAngle);
    const endInner = this.polarToCartesian(cx, cy, rInner, endAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    // Path from startOuter -> arc to endOuter -> line to startInner -> arc back to endInner -> close
    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${rInner} ${rInner} 0 ${largeArcFlag} 1 ${endInner.x} ${endInner.y}`,
      'Z'
    ].join(' ');
  }

  private computeArcs() {
    this.arcs = [];
    this.total = this.segments.reduce((s, seg) => s + seg.amount, 0);
    let start = 0;
    const cx = 100;
    const cy = 100;
    const rOuter = 70;
    const rInner = 45;

    for (const seg of this.segments) {
      const sweep = seg.percent / 100 * 360;
      const end = start + sweep;
      const d = this.describeArcPath(cx, cy, rOuter, rInner, start, end);
      this.arcs.push({ d, color: seg.color, category: seg.category, amount: seg.amount, percent: seg.percent });
      start = end;
    }
  }
}
