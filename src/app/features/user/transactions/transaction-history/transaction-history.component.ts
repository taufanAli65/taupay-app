import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserTransactionService } from '@features/user/services/user-transaction.service';
import { TransactionHistoryItem } from '@shared/models/transaction.model';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-user-transaction-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyIdrPipe, PaginationComponent, IconComponent],
  templateUrl: './transaction-history.component.html'
})
export class UserTransactionHistoryComponent implements OnInit {
  private userTransactionService = inject(UserTransactionService);

  history = signal<TransactionHistoryItem[]>([]);
  loading = signal(false);
  currentPage = signal(0);
  totalPages = signal(1);

  startDate = '';
  endDate = '';

  ngOnInit(): void { this.loadPage(0); }

  applyFilters(): void { this.loadPage(0); }

  loadPage(page: number): void {
    this.loading.set(true);
    this.userTransactionService.getHistory(this.startDate || undefined, this.endDate || undefined, page, 10).subscribe({
      next: res => {
        this.history.set(res.data ?? []);
        this.currentPage.set(res.pagination?.page ?? page);
        const hasMore = (res.data?.length ?? 0) >= 10;
        this.totalPages.set(hasMore ? page + 2 : page + 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  itemId(item: TransactionHistoryItem): string {
    return item.historyId || item.trx_id || '-';
  }

  itemDate(item: TransactionHistoryItem): string {
    return item.createdAt || item.created_at || '';
  }

  itemAmount(item: TransactionHistoryItem): number {
    if (typeof item.amount === 'number') return item.amount;
    if (item.products?.length) {
      return item.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    }
    return 0;
  }

  itemCounterparty(item: TransactionHistoryItem): string {
    return item.counterpartyName || '—';
  }

  itemCategory(item: TransactionHistoryItem): string {
    return item.category || '—';
  }
}
