import { Component, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminMerchantStore } from '@features/admin/state/admin-merchant.store';
import { MerchantProfile } from '@shared/models/merchant.model';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { TableColumn, TableFilter } from '@shared/components/data-table/data-table.model';

@Component({
  selector: 'app-admin-merchant-list',
  standalone: true,
  imports: [RouterLink, CommonModule, DataTableComponent],
  templateUrl: './merchant-list.component.html'
})
export class AdminMerchantListComponent implements OnInit {
  readonly store = inject(AdminMerchantStore);

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
}
