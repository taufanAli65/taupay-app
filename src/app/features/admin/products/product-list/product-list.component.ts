import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminProductStore } from '@features/admin/state/admin-product.store';
import { Product } from '@shared/models/product.model';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { TableColumn, TableFilter } from '@shared/components/data-table/data-table.model';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-admin-product-list',
  standalone: true,
  imports: [CommonModule, CurrencyIdrPipe, DataTableComponent, ModalComponent, IconComponent],
  templateUrl: './product-list.component.html'
})
export class AdminProductListComponent implements OnInit {
  readonly store = inject(AdminProductStore);

  showConfirmModal = signal(false);
  targetProduct = signal<Product | null>(null);
  targetAction = signal<boolean>(false);

  columns: TableColumn[] = [
    { key: 'product', label: 'Product', custom: true },
    { key: 'merchantName', label: 'Merchant', custom: true },
    { key: 'categoryName', label: 'Category', custom: true },
    { key: 'price', label: 'Price', custom: true },
    { key: 'stock', label: 'Stock', custom: true },
    { key: 'status', label: 'Status', custom: true },
    { key: 'actions', label: 'Actions', className: 'text-right', custom: true }
  ];

  productFilters = computed<TableFilter[]>(() => [
    {
      key: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Status', value: '' },
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' }
      ]
    }
  ]);

  ngOnInit(): void {
    this.store.loadPage(0);
    this.store.loadInitialData();
  }

  triggerToggle(p: Product, activate: boolean): void {
    this.targetProduct.set(p);
    this.targetAction.set(activate);
    this.showConfirmModal.set(true);
  }

  confirmToggle(): void {
    const p = this.targetProduct();
    if (p) {
      this.store.toggleStatus(p, this.targetAction());
      this.closeModal();
    }
  }

  closeModal(): void {
    this.showConfirmModal.set(false);
    this.targetProduct.set(null);
  }
}
