import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';
import { UserService } from '../services/user.service';
import { UserTransactionService } from '../services/user-transaction.service';
import { UserProfile } from '@shared/models/user.model';
import { TransactionHistoryItem } from '@shared/models/transaction.model';

interface ChartSegment {
  category: string;
  amount: number;
  color: string;
  percent: number;
}

interface UserDashboardState {
  profile: UserProfile | null;
  transactions: TransactionHistoryItem[];
  chartSegments: ChartSegment[];
  totalSpending: number;
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserDashboardStore {
  private userService = inject(UserService);
  private userTransactionService = inject(UserTransactionService);

  private state = signal<UserDashboardState>({
    profile: null,
    transactions: [],
    chartSegments: [],
    totalSpending: 0,
    loading: false
  });

  profile = computed(() => this.state().profile);
  transactions = computed(() => this.state().transactions);
  chartSegments = computed(() => this.state().chartSegments);
  totalSpending = computed(() => this.state().totalSpending);
  loading = computed(() => this.state().loading);

  loadDashboardData(): void {
    this.patchState({ loading: true });

    forkJoin({
      profile: this.userService.getMe(),
      history: this.userTransactionService.getHistory(undefined, undefined, 0, 100)
    }).pipe(
      finalize(() => this.patchState({ loading: false }))
    ).subscribe({
      next: res => {
        const items = res.history.data ?? [];
        this.patchState({
          profile: res.profile.data,
          transactions: items
        });
        this.computeChartSegments(items);
      },
      error: () => {
        this.patchState({
          profile: null,
          transactions: [],
          chartSegments: [],
          totalSpending: 0
        });
      }
    });
  }

  private computeChartSegments(items: TransactionHistoryItem[]): void {
    const grouped = new Map<string, number>();
    let total = 0;

    for (const item of items) {
      const category = item.category ?? 'Uncategorized';
      let amount = typeof item.amount === 'number' ? item.amount : 0;

      if (!amount && item.products?.length) {
        amount = item.products.reduce((sum, product) => sum + (product.priceAtTime ?? 0) * (product.quantity ?? 0), 0);
      }

      total += amount;
      grouped.set(category, (grouped.get(category) ?? 0) + amount);
    }

    const palette = ['#0B422A', '#116A43', '#4ade80', '#86efac', '#bbf7d0', '#6366f1', '#f59e0b', '#ef4444'];
    const segments: ChartSegment[] = [];
    let index = 0;

    for (const [category, amount] of grouped.entries()) {
      const color = palette[index % palette.length];
      const percent = total > 0 ? (amount / total) * 100 : 0;
      segments.push({ category, amount, color, percent });
      index++;
    }

    this.patchState({ totalSpending: total, chartSegments: segments });
  }

  private patchState(partial: Partial<UserDashboardState>) {
    this.state.update(state => ({ ...state, ...partial }));
  }
}