import { Component, inject, OnInit, computed, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminMerchantStore } from '@features/admin/state/admin-merchant.store';
import { MerchantProfile } from '@shared/models/merchant.model';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { TableColumn, TableFilter } from '@shared/components/data-table/data-table.model';
import { FormModalComponent } from '@shared/components/modal/form-modal.component';
import { AdminMerchantDetailComponent } from '../merchant-detail/merchant-detail.component';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-admin-merchant-list',
  standalone: true,
  imports: [RouterLink, CommonModule, DataTableComponent, FormModalComponent, AdminMerchantDetailComponent, IconComponent],
  templateUrl: './merchant-list.component.html'
})
export class AdminMerchantListComponent implements OnInit {
  readonly store = inject(AdminMerchantStore);
  @ViewChild(AdminMerchantDetailComponent) merchantForm?: AdminMerchantDetailComponent;

  showFormModal = signal(false);
  selectedMerchantId = signal<string | null>(null);

  columns: TableColumn[] = [
    { key: 'merchant', label: 'Merchant', custom: true },
    { key: 'email', label: 'Email' },
    { key: 'categoryName', label: 'Category', custom: true },
    { key: 'address', label: 'Address' },
    { key: 'status', label: 'Status', custom: true },
    { key: 'actions', label: 'Actions', className: 'text-right', custom: true }
  ];

  merchantFilters = computed<TableFilter[]>(() => [
    {
      key: 'categoryId',
      label: 'Category',
      type: 'select',
      options: [
        { label: 'All Category', value: '' },
        ...this.store.categories().map(c => ({ label: c.name, value: c.id }))
      ]
    },
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
    if (this.store.categories().length === 0) {
      this.store.loadCategories();
    }
  }

  openAddModal() {
    this.selectedMerchantId.set(null);
    this.showFormModal.set(true);
  }

  openEditModal(id: string) {
    this.selectedMerchantId.set(id);
    this.showFormModal.set(true);
  }

  closeFormModal() {
    this.showFormModal.set(false);
    this.selectedMerchantId.set(null);
  }

  saveMerchant() {
    this.merchantForm?.submit();
  }

  onMerchantSaved() {
    this.closeFormModal();
    this.store.loadPage(this.store.currentPage());
  }
}
