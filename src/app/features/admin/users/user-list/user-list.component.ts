import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminUserStore } from '@features/admin/state/admin-user.store';

import { UserProfile } from '@shared/models/user.model';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { TableColumn, TableFilter } from '@shared/components/data-table/data-table.model';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-admin-user-list',
  standalone: true,
  imports: [RouterLink, CommonModule, DataTableComponent, ModalComponent, IconComponent],
  templateUrl: './user-list.component.html'
})
export class AdminUserListComponent implements OnInit {
  readonly store = inject(AdminUserStore);

  // Status Confirm Modal State
  showStatusModal = signal(false);
  userToToggle = signal<UserProfile | null>(null);
  targetStatus = signal<boolean>(false);

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

  // --- STATUS TOGGLE ACTIONS ---
  triggerStatusConfirm(u: UserProfile, activate: boolean) {
    this.userToToggle.set(u);
    this.targetStatus.set(activate);
    this.showStatusModal.set(true);
  }

  confirmStatusToggle() {
    const u = this.userToToggle();
    if (u) {
      this.store.toggleStatus(u, this.targetStatus());
      this.closeStatusModal();
    }
  }

  closeStatusModal() {
    this.showStatusModal.set(false);
    this.userToToggle.set(null);
  }
}
