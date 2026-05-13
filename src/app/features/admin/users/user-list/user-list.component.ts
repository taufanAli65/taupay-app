import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminUserService } from '@features/admin/services/admin-user.service';
import { UserProfile } from '@shared/models/user.model';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { ToastService } from '@shared/components/toast/toast.service';

@Component({
  selector: 'app-admin-user-list',
  standalone: true,
  imports: [RouterLink, CommonModule, PaginationComponent],
  templateUrl: './user-list.component.html'
})
export class AdminUserListComponent implements OnInit {
  private userService = inject(AdminUserService);
  private toast = inject(ToastService);
  users = signal<UserProfile[]>([]);
  currentPage = signal(0);
  totalPages = signal(1);

  initials(u: UserProfile): string {
    return ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase() || '?';
  }

  ngOnInit(): void { this.loadPage(0); }

  loadPage(page: number): void {
    this.userService.getAll(page, 10).subscribe(r => {
      this.users.set(r.data ?? []);
      this.currentPage.set(r.pagination?.page ?? page);
    });
  }

  toggle(u: UserProfile, activate: boolean): void {
    const call = activate ? this.userService.activate(u.id) : this.userService.deactivate(u.id);
    call.subscribe(() => {
      this.toast.show(`User ${activate ? 'activated' : 'deactivated'}!`, 'success');
      this.loadPage(this.currentPage());
    });
  }
}
