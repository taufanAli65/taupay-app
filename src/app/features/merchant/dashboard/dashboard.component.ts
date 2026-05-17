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

@Component({
  selector: 'app-merchant-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, CurrencyIdrPipe, IconComponent, DataTableComponent, FormModalComponent, ProductFormComponent],
  templateUrl: './dashboard.component.html'
})
export class MerchantDashboardComponent implements OnInit {
  readonly store = inject(MerchantDashboardStore);
  @ViewChild(ProductFormComponent) productForm?: ProductFormComponent;

  // Modal State
  showFormModal = signal(false);

  columns: TableColumn[] = [
    { key: 'product', label: 'Product', custom: true },
    { key: 'price', label: 'Price', custom: true },
    { key: 'stock', label: 'Stock', className: 'font-mono' },
    { key: 'isActive', label: 'Status', custom: true }
  ];

  ngOnInit(): void {
    this.store.loadDashboardData();
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
}
