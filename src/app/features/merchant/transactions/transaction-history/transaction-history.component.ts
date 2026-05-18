import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TransactionHistoryStore } from '../../state/transaction-history.store';
import { TransactionHistoryItem } from '@shared/models/transaction.model';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { TableColumn } from '@shared/components/data-table/data-table.model';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyIdrPipe, DataTableComponent, IconComponent],
  templateUrl: './transaction-history.component.html'
})
export class TransactionHistoryComponent implements OnInit {
  readonly store = inject(TransactionHistoryStore);

  columns: TableColumn[] = [
    { key: 'trx_id', label: 'Transaction ID', custom: true },
    { key: 'createdAt', label: 'Date', custom: true },
    { key: 'amount', label: 'Amount', custom: true, className: 'text-right' }
  ];

  ngOnInit(): void {
    this.store.loadPage(0);
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
      return item.products.reduce((sum, p) => sum + p.priceAtTime * p.quantity, 0);
    }
    return 0;
  }
}
