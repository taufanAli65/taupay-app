import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '@shared/components/icon/icon.component';
import { PieChartComponent } from '@shared/components/pie-chart/pie-chart.component';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import { UserDashboardStore } from '@features/user/state/user-dashboard.store';


@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [RouterLink, IconComponent, PieChartComponent, CurrencyIdrPipe],
  templateUrl: './dashboard.component.html'
})
export class UserDashboardComponent implements OnInit {
  private dashboardStore = inject(UserDashboardStore);
  profile = this.dashboardStore.profile;
  transactions = this.dashboardStore.transactions;
  chartSegments = this.dashboardStore.chartSegments;
  totalSpending = this.dashboardStore.totalSpending;

  get initials(): string {
    const p = this.profile();
    if (!p) return '?';
    return ((p.firstName?.[0] ?? '') + (p.lastName?.[0] ?? '')).toUpperCase();
  }

  ngOnInit(): void {
    this.dashboardStore.loadDashboardData();
  }
}
