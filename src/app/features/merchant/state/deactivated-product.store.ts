import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductService } from '../services/product.service';
import { Product } from '@shared/models/product.model';
import { finalize } from 'rxjs';
import { ToastService } from '@shared/components/toast/toast.service';

interface DeactivatedProductState {
  products: Product[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  searchQuery: string;
}

@Injectable({ providedIn: 'root' })
export class DeactivatedProductStore {
  private productService = inject(ProductService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  private state = signal<DeactivatedProductState>({
    products: [],
    loading: false,
    currentPage: 0,
    totalPages: 1,
    totalElements: 0,
    searchQuery: ''
  });

  products = computed(() => this.state().products);
  loading = computed(() => this.state().loading);
  currentPage = computed(() => this.state().currentPage);
  totalPages = computed(() => this.state().totalPages);
  totalElements = computed(() => this.state().totalElements);
  searchQuery = computed(() => this.state().searchQuery);

  private searchTimeout?: ReturnType<typeof setTimeout>;

  loadPage(page: number) {
    this.patchState({ loading: true });
    this.productService.getDeactivatedProducts(page, 10, this.searchQuery())
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

  setSearchQuery(query: string) {
    this.patchState({ searchQuery: query });
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadPage(0);
    }, 500);
  }

  activateProduct(product: Product) {
    this.patchState({ loading: true });
    this.productService.activate(product.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.show(`Product ${product.name} activated!`, 'success');
          this.loadPage(this.currentPage());
        },
        error: () => {
          this.patchState({ loading: false });
          this.toast.show('Failed to activate product', 'danger');
        }
      });
  }

  private patchState(partial: Partial<DeactivatedProductState>) {
    this.state.update(s => ({ ...s, ...partial }));
  }
}
