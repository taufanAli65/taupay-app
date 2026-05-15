import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminProductService } from '../services/admin-product.service';
import { AdminMerchantService } from '../services/admin-merchant.service';
import { Product, ProductCategory } from '@shared/models/product.model';
import { MerchantProfile } from '@shared/models/merchant.model';
import { finalize } from 'rxjs';
import { ToastService } from '@shared/components/toast/toast.service';

interface AdminProductState {
  products: Product[];
  categories: ProductCategory[];
  merchants: MerchantProfile[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  searchQuery: string;
  filters: { [key: string]: any };
}

@Injectable({ providedIn: 'root' })
export class AdminProductStore {
  private productService = inject(AdminProductService);
  private merchantService = inject(AdminMerchantService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  // --- STATE ---
  private state = signal<AdminProductState>({
    products: [],
    categories: [],
    merchants: [],
    loading: false,
    currentPage: 0,
    totalPages: 1,
    totalElements: 0,
    searchQuery: '',
    filters: { isActive: '' }
  });

  // --- SELECTORS ---
  products = computed(() => this.state().products);
  categories = computed(() => this.state().categories);
  merchants = computed(() => this.state().merchants);
  loading = computed(() => this.state().loading);
  currentPage = computed(() => this.state().currentPage);
  totalPages = computed(() => this.state().totalPages);
  totalElements = computed(() => this.state().totalElements);
  searchQuery = computed(() => this.state().searchQuery);
  activeFilters = computed(() => this.state().filters);

  private searchTimeout?: ReturnType<typeof setTimeout>;

  loadPage(page: number) {
    this.patchState({ loading: true });
    this.productService.getAll(page, 10, this.searchQuery(), this.activeFilters())
      .pipe(
        finalize(() => this.patchState({ loading: false })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(r => {
        this.patchState({
          products: r.data ?? [],
          currentPage: r.pagination?.page ?? page,
          totalPages: r.pagination?.totalPages ?? 1,
          totalElements: r.pagination?.totalElements ?? 0
        });
      });
  }

  loadInitialData() {
    this.merchantService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.patchState({ categories: r.data ?? [] }));

    this.merchantService.getAll(0, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.patchState({ merchants: r.data ?? [] }));
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

  toggleStatus(product: Product, activate: boolean) {
    const previous = [...this.products()];
    const updated = previous.map(p => p.id === product.id ? { ...p, isActive: activate } : p);
    this.patchState({ products: updated });

    const call = activate ? this.productService.activate(product.id) : this.productService.deactivate(product.id);
    call.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.show(`Product ${activate ? 'activated' : 'deactivated'}!`, 'success');
        this.loadPage(this.currentPage()); // Refresh to ensure everything is sync
      },
      error: () => {
        this.patchState({ products: previous });
        this.toast.show('Failed to update product status', 'danger');
      }
    });
  }

  private patchState(partial: Partial<AdminProductState>) {
    this.state.update(s => ({ ...s, ...partial }));
  }
}
