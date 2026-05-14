import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminUserStore } from '@features/admin/state/admin-user.store';

import { UserProfile } from '@shared/models/user.model';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { TableColumn, TableFilter } from '@shared/components/data-table/data-table.model';

@Component({
  selector: 'app-admin-user-list',
  standalone: true,
  imports: [RouterLink, CommonModule, DataTableComponent],
  templateUrl: './user-list.component.html'
})
export class AdminUserListComponent implements OnInit {
  readonly store = inject(AdminUserStore);

  columns: TableColumn[] = [
    { key: 'user', label: 'User', custom: true },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    { key: 'birthDate', label: 'Birth Date' },
    { key: 'status', label: 'Status', custom: true },
    { key: 'actions', label: 'Actions', className: 'text-right', custom: true }
  ];

  userFilters: TableFilter[] = [
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
  ];

  initials(u: UserProfile): string {
    return ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase() || '?';
  }

  ngOnInit(): void {
    if (this.store.users().length === 0) {
      this.store.loadPage(0);
    }
  }
}
