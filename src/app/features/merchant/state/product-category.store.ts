import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductService } from '../services/product.service';
import { ProductCategory } from '@shared/models/product.model';
import { finalize } from 'rxjs';
import { ToastService } from '@shared/components/toast/toast.service';

interface ProductCategoryState {
  categories: ProductCategory[];
  loading: boolean;
  searchQuery: string;
}

@Injectable({ providedIn: 'root' })
export class ProductCategoryStore {
  private productService = inject(ProductService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  private state = signal<ProductCategoryState>({
    categories: [],
    loading: false,
    searchQuery: ''
  });

  categories = computed(() => this.state().categories);
  loading = computed(() => this.state().loading);
  searchQuery = computed(() => this.state().searchQuery);
  totalElements = computed(() => this.state().categories.length);

  private searchTimeout?: ReturnType<typeof setTimeout>;

  loadCategories() {
    this.patchState({ loading: true });
    this.productService.getCategories(this.searchQuery())
      .pipe(
        finalize(() => this.patchState({ loading: false })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(r => {
        this.patchState({ categories: r.data ?? [] });
      });
  }

  setSearchQuery(query: string) {
    this.patchState({ searchQuery: query });
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadCategories();
    }, 500);
  }

  createCategory(name: string) {
    this.patchState({ loading: true });
    this.productService.createCategory(name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.show('Category created!', 'success');
          this.loadCategories();
        },
        error: () => {
          this.patchState({ loading: false });
          // Error handling is managed by interceptor
        }
      });
  }

  updateCategory(id: string, name: string) {
    this.patchState({ loading: true });
    this.productService.updateCategory(id, name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.show('Category updated!', 'success');
          this.loadCategories();
        },
        error: () => {
          this.patchState({ loading: false });
        }
      });
  }

  deleteCategory(id: string) {
    this.patchState({ loading: true });
    this.productService.deleteCategory(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.show('Category deleted!', 'success');
          this.loadCategories();
        },
        error: () => {
          this.patchState({ loading: false });
        }
      });
  }

  private patchState(partial: Partial<ProductCategoryState>) {
    this.state.update(s => ({ ...s, ...partial }));
  }
}
