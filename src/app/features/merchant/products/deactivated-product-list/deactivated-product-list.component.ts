import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DeactivatedProductStore } from '../../state/deactivated-product.store';
import { Product } from '@shared/models/product.model';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { TableColumn } from '@shared/components/data-table/data-table.model';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-deactivated-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyIdrPipe, DataTableComponent, ModalComponent, IconComponent],
  templateUrl: './deactivated-product-list.component.html'
})
export class DeactivatedProductListComponent implements OnInit {
  readonly store = inject(DeactivatedProductStore);

  showConfirmModal = signal(false);
  targetProduct = signal<Product | null>(null);

  columns: TableColumn[] = [
    { key: 'product', label: 'Product', custom: true },
    { key: 'category', label: 'Category', custom: true },
    { key: 'price', label: 'Price', custom: true },
    { key: 'stock', label: 'Stock', className: 'font-mono' },
    { key: 'actions', label: 'Actions', className: 'text-right', custom: true }
  ];

  ngOnInit(): void {
    this.store.loadPage(0);
  }

  triggerActivate(p: Product): void {
    this.targetProduct.set(p);
    this.showConfirmModal.set(true);
  }

  confirmActivate(): void {
    const p = this.targetProduct();
    if (p) {
      this.store.activateProduct(p);
      this.closeModal();
    }
  }

  closeModal(): void {
    this.showConfirmModal.set(false);
    this.targetProduct.set(null);
  }
}
