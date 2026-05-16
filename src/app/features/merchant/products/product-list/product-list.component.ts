import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductStore } from '../../state/product.store';
import { Product } from '@shared/models/product.model';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { TableColumn, TableFilter } from '@shared/components/data-table/data-table.model';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [RouterLink, CommonModule, CurrencyIdrPipe, DataTableComponent, ModalComponent, IconComponent],
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  readonly store = inject(ProductStore);

  showConfirmModal = signal(false);
  targetProduct = signal<Product | null>(null);
  targetAction = signal<boolean>(false);

  columns: TableColumn[] = [
    { key: 'product', label: 'Product', custom: true },
    { key: 'category', label: 'Category', custom: true },
    { key: 'price', label: 'Price', custom: true },
    { key: 'stock', label: 'Stock', className: 'font-mono' },
    { key: 'actions', label: 'Actions', className: 'text-right', custom: true }
  ];

  productFilters = computed<TableFilter[]>(() => [
    {
      key: 'categoryId',
      label: 'Category',
      type: 'select',
      options: [
        { label: 'All Categories', value: '' },
        ...this.store.categories().map(c => ({ label: c.name, value: c.id }))
      ]
    },
    {
      key: 'inStock',
      label: 'Stock Status',
      type: 'select',
      options: [
        { label: 'All Status', value: '' },
        { label: 'In Stock', value: 'true' },
        { label: 'Out of Stock', value: 'false' }
      ]
    }
  ]);

  ngOnInit(): void {
    this.store.loadPage(0);
    this.store.loadCategories();
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
