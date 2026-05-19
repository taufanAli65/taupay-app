import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminUserService } from '../services/admin-user.service';
import { UserProfile } from '@shared/models/user.model';
import { finalize } from 'rxjs';
import { ToastService } from '@shared/components/toast/toast.service';

interface AdminUserState {
  users: UserProfile[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  searchQuery: string;
  filters: { [key: string]: any };
}

@Injectable({ providedIn: 'root' })
export class AdminUserStore {
  private userService = inject(AdminUserService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  private state = signal<AdminUserState>({
    users: [],
    loading: false,
    currentPage: 0,
    totalPages: 1,
    totalElements: 0,
    searchQuery: '',
    filters: { isActive: '' }
  });

  users = computed(() => this.state().users);
  loading = computed(() => this.state().loading);
  currentPage = computed(() => this.state().currentPage);
  totalPages = computed(() => this.state().totalPages);
  totalElements = computed(() => this.state().totalElements);
  searchQuery = computed(() => this.state().searchQuery);
  activeFilters = computed(() => this.state().filters);

  private searchTimeout?: ReturnType<typeof setTimeout>;

  loadPage(page: number) {
    this.patchState({ loading: true });
    
    this.userService.getAll(page, 10, this.searchQuery(), this.activeFilters())
      .pipe(
        finalize(() => this.patchState({ loading: false })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(r => {
        this.patchState({
          users: r.data ?? [],
          currentPage: r.pagination?.page ?? page,
          totalPages: r.pagination?.totalPages ?? 1,
          totalElements: r.pagination?.totalElements ?? 0
        });
      });
  }

  setSearchQuery(query: string) {
    this.patchState({ searchQuery: query });
    
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadPage(0);
    }, 500);
  }

  setActiveFilters(filters: { [key: string]: any }) {
    this.patchState({ filters });
    this.loadPage(0);
  }

  toggleStatus(user: UserProfile, activate: boolean) {
    const previousState = {
      users: [...this.users()],
      totalElements: this.totalElements(),
      totalPages: this.totalPages(),
      currentPage: this.currentPage()
    };

    const updatedUsers = previousState.users.map(u => 
      u.id === user.id ? { ...u, isActive: activate } : u
    );

    const filteredUsers = updatedUsers.filter(u => this.matchesActiveFilter(u.isActive));
    const removedByFilter = filteredUsers.length !== updatedUsers.length;
    
    const nextTotalElements = removedByFilter
      ? Math.max(0, previousState.totalElements - 1)
      : previousState.totalElements;
    const nextTotalPages = Math.max(1, Math.ceil(nextTotalElements / 10));

    this.patchState({ 
      users: filteredUsers,
      totalElements: nextTotalElements,
      totalPages: nextTotalPages
    });

    const call = activate ? this.userService.activate(user.id) : this.userService.deactivate(user.id);

    call.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.show(`User ${activate ? 'activated' : 'deactivated'}!`, 'success');
        const targetPage = Math.min(previousState.currentPage, Math.max(0, nextTotalPages - 1));
        this.loadPage(targetPage);
      },
      error: () => {
        this.patchState({ 
          users: previousState.users,
          totalElements: previousState.totalElements,
          totalPages: previousState.totalPages,
          currentPage: previousState.currentPage
        });
        this.toast.show('Failed to update user status', 'danger');
      }
    });
  }

  private matchesActiveFilter(isActive: boolean): boolean {
    const filter = this.activeFilters()?.['isActive'];
    if (filter === '' || filter === null || filter === undefined) return true;
    const boolFilter = filter === true || filter === 'true';
    return isActive === boolFilter;
  }

  private patchState(partial: Partial<AdminUserState>) {
    this.state.update(s => ({ ...s, ...partial }));
  }
}
