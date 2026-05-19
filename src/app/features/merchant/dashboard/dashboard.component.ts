import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MerchantDashboardStore } from '../state/merchant-dashboard.store';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import { IconComponent } from '@shared/components/icon/icon.component';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { TableColumn } from '@shared/components/data-table/data-table.model';
import { FormModalComponent } from '@shared/components/modal/form-modal.component';
import { ProductFormComponent } from '../products/product-form/product-form.component';
import { TransactionHistoryItem } from '@shared/models/transaction.model';
import { SparklineChartComponent } from '@shared/components/sparkline-chart/sparkline-chart.component';
import { computed } from '@angular/core';

@Component({
  selector: 'app-merchant-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, CurrencyIdrPipe, IconComponent, DataTableComponent, FormModalComponent, ProductFormComponent, SparklineChartComponent],
  templateUrl: './dashboard.component.html'
})
export class MerchantDashboardComponent implements OnInit {
  readonly store = inject(MerchantDashboardStore);
  @ViewChild(ProductFormComponent) productForm?: ProductFormComponent;

  // Modal State
  showFormModal = signal(false);
  sevenDayTotal = computed(() => this.store.revenueTrend().reduce((sum, point) => sum + (point.revenue ?? 0), 0));
  sevenDayAverage = computed(() => {
    const days = this.store.revenueTrend().length || 1;
    return Math.round(this.sevenDayTotal() / days);
  });

  columns: TableColumn[] = [
    { key: 'trx_id', label: 'Transaction ID', custom: true },
    { key: 'createdAt', label: 'Date', custom: true },
    { key: 'counterpartyName', label: 'Customer', custom: true },
    { key: 'amount', label: 'Amount', custom: true, className: 'text-right' }
  ];

  ngOnInit(): void {
    this.store.loadDashboardData();
  }

  percentChange(today: number, yesterday: number): number {
    if (!yesterday || yesterday === 0) return today === 0 ? 0 : 100;
    return Math.round(((today - yesterday) / Math.abs(yesterday)) * 10000) / 100;
  }

  // --- FORM MODAL ACTIONS ---
  openAddModal() {
    this.showFormModal.set(true);
  }

  closeFormModal() {
    this.showFormModal.set(false);
  }

  saveProduct() {
    this.productForm?.submit();
  }

  onProductSaved() {
    this.closeFormModal();
    this.store.loadDashboardData(); // Refresh stats and recent list
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
