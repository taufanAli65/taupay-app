import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '@features/user/services/user.service';
import { UserProfile } from '@shared/models/user.model';
import { IconComponent } from '@shared/components/icon/icon.component';
import { PieChartComponent } from '@shared/components/pie-chart/pie-chart.component';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import { UserTransactionService } from '@features/user/services/user-transaction.service';
import { TransactionHistoryItem } from '@shared/models/transaction.model';


@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [RouterLink, IconComponent, PieChartComponent, CurrencyIdrPipe],
  templateUrl: './dashboard.component.html'
})
export class UserDashboardComponent implements OnInit {
  private userService = inject(UserService);
  private userTransactionService = inject(UserTransactionService);
  profile = signal<UserProfile | null>(null);

  transactions = signal<TransactionHistoryItem[]>([]);
  chartSegments = signal<{ category: string; amount: number; color: string; percent: number }[]>([]);
  totalSpending = signal(0);

  get initials(): string {
    const p = this.profile();
    if (!p) return '?';
    return ((p.firstName?.[0] ?? '') + (p.lastName?.[0] ?? '')).toUpperCase();
  }

  ngOnInit(): void {
    this.userService.getMe().subscribe(res => this.profile.set(res.data));

    this.userTransactionService.getHistory(undefined, undefined, 0, 100).subscribe({
      next: (res) => {
        const items = res.data ?? [];
        this.transactions.set(items);
        this.computeChartSegments(items);
      },
      error: () => {
        this.transactions.set([]);
        this.chartSegments.set([]);
        this.totalSpending.set(0);
      }
    });
  }

  private computeChartSegments(items: TransactionHistoryItem[]): void {
    const grouped = new Map<string, number>();
    let total = 0;
    for (const it of items) {
      const category = it.category ?? 'Uncategorized';
      let amount = typeof it.amount === 'number' ? it.amount : 0;
      if (!amount && it.products?.length) {
        amount = it.products.reduce((s, p) => s + (p.priceAtTime ?? 0) * (p.quantity ?? 0), 0);
      }
      total += amount;
      grouped.set(category, (grouped.get(category) ?? 0) + amount);
    }

    const palette = ['#0B422A','#116A43','#4ade80','#86efac','#bbf7d0','#6366f1','#f59e0b','#ef4444'];
    const segments: { category: string; amount: number; color: string; percent: number }[] = [];
    let i = 0;
    for (const [category, amount] of grouped.entries()) {
      const color = palette[i % palette.length];
      const percent = total > 0 ? (amount / total) * 100 : 0;
      segments.push({ category, amount, color, percent });
      i++;
    }

    this.totalSpending.set(total);
    this.chartSegments.set(segments);
  }
}
