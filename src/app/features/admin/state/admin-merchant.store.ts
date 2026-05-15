import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminMerchantService } from '../services/admin-merchant.service';
import { MerchantProfile, MerchantCategory } from '@shared/models/merchant.model';
import { finalize } from 'rxjs';
import { ToastService } from '@shared/components/toast/toast.service';

interface AdminMerchantState {
  merchants: MerchantProfile[];
  categories: MerchantCategory[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  searchQuery: string;
  filters: { [key: string]: any };
}

@Injectable({ providedIn: 'root' })
export class AdminMerchantStore {
  private merchantService = inject(AdminMerchantService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  private state = signal<AdminMerchantState>({
    merchants: [],
    categories: [],
    loading: false,
    currentPage: 0,
    totalPages: 1,
    totalElements: 0,
    searchQuery: '',
    filters: { isActive: '', categoryId: '' }
  });

  merchants = computed(() => this.state().merchants);
  categories = computed(() => this.state().categories);
  loading = computed(() => this.state().loading);
  currentPage = computed(() => this.state().currentPage);
  totalPages = computed(() => this.state().totalPages);
  totalElements = computed(() => this.state().totalElements);
  searchQuery = computed(() => this.state().searchQuery);
  activeFilters = computed(() => this.state().filters);

  private searchTimeout?: ReturnType<typeof setTimeout>;

  loadPage(page: number) {
    this.patchState({ loading: true });
    
    this.merchantService.getAll(page, 10, this.searchQuery(), this.activeFilters())
      .pipe(
        finalize(() => this.patchState({ loading: false })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(r => {
        this.patchState({
          merchants: r.data ?? [],
          currentPage: r.pagination?.page ?? page,
          totalPages: r.pagination?.totalPages ?? 1,
          totalElements: r.pagination?.totalElements ?? 0
        });
      });
  }

  loadCategories() {
    this.merchantService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => {
        this.patchState({ categories: r.data ?? [] });
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

  toggleStatus(merchant: MerchantProfile, activate: boolean) {
    const previousState = {
      merchants: [...this.merchants()],
      totalElements: this.totalElements(),
      totalPages: this.totalPages(),
      currentPage: this.currentPage()
    };
    const updatedMerchants = previousState.merchants.map(m =>
      m.id === merchant.id ? { ...m, active: activate } : m
    );
    const filteredMerchants = updatedMerchants.filter(m => this.matchesActiveFilter(m.active));
    const removedByFilter = filteredMerchants.length !== updatedMerchants.length;
    const nextTotalElements = removedByFilter
      ? Math.max(0, previousState.totalElements - 1)
      : previousState.totalElements;
    const nextTotalPages = this.getTotalPages(nextTotalElements);

    this.patchState({
      merchants: filteredMerchants,
      totalElements: nextTotalElements,
      totalPages: nextTotalPages
    });

    const call = activate ? this.merchantService.activate(merchant.id) : this.merchantService.deactivate(merchant.id);
    call.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.show(`Merchant ${activate ? 'activated' : 'deactivated'}!`, 'success');
        const targetPage = Math.min(previousState.currentPage, Math.max(0, nextTotalPages - 1));
        this.loadPage(targetPage);
      },
      error: () => {
        this.patchState({
          merchants: previousState.merchants,
          totalElements: previousState.totalElements,
          totalPages: previousState.totalPages,
          currentPage: previousState.currentPage
        });
        this.toast.show('Failed to update merchant status', 'danger');
      }
    });
  }

  private matchesActiveFilter(isActive: boolean): boolean {
    const isActiveFilter = this.activeFilters()?.['isActive'];

    if (isActiveFilter === '' || isActiveFilter === null || isActiveFilter === undefined) {
      return true;
    }

    if (isActiveFilter === true || isActiveFilter === 'true') {
      return isActive;
    }

    if (isActiveFilter === false || isActiveFilter === 'false') {
      return !isActive;
    }

    return true;
  }

  private getTotalPages(totalElements: number): number {
    return Math.max(1, Math.ceil(totalElements / 10));
  }

  private patchState(partial: Partial<AdminMerchantState>) {
    this.state.update(s => ({ ...s, ...partial }));
  }
}
