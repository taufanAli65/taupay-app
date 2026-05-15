import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminMerchantService } from '../services/admin-merchant.service';
import { MerchantCategory } from '@shared/models/merchant.model';
import { finalize } from 'rxjs';
import { ToastService } from '@shared/components/toast/toast.service';

interface AdminCategoryState {
  categories: MerchantCategory[];
  loading: boolean;
  searchQuery: string;
  totalElements: number;
}

@Injectable({ providedIn: 'root' })
export class AdminCategoryStore {
  private merchantService = inject(AdminMerchantService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  private state = signal<AdminCategoryState>({
    categories: [],
    loading: false,
    searchQuery: '',
    totalElements: 0
  });

  categories = computed(() => this.state().categories);
  loading = computed(() => this.state().loading);
  searchQuery = computed(() => this.state().searchQuery);
  totalElements = computed(() => this.state().totalElements);

  private searchTimeout?: ReturnType<typeof setTimeout>;

  loadCategories() {
    this.patchState({ loading: true });
    this.merchantService.getCategories(this.searchQuery())
      .pipe(
        finalize(() => this.patchState({ loading: false })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(r => {
        const data = r.data ?? [];
        this.patchState({ 
          categories: data,
          totalElements: data.length // Untuk list tanpa pagination formal, ambil dari array length
        });
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
    this.merchantService.createCategory(name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.show('Category created!', 'success');
          this.loadCategories(); // Refresh untuk mendapatkan urutan terbaru dari server
        },
        error: () => {
          this.patchState({ loading: false });
          this.toast.show('Failed to create category', 'danger');
        }
      });
  }

  updateCategory(id: string, name: string) {
    this.patchState({ loading: true });
    this.merchantService.updateCategory(id, name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.show('Category updated!', 'success');
          this.loadCategories(); // Refresh untuk mendapatkan urutan terbaru
        },
        error: () => {
          this.patchState({ loading: false });
          this.toast.show('Failed to update category', 'danger');
        }
      });
  }

  deleteCategory(id: string) {
    this.patchState({ loading: true });
    this.merchantService.deleteCategory(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.show('Category deleted!', 'success');
          this.loadCategories(); // Refresh setelah hapus
        },
        error: () => {
          this.patchState({ loading: false });
          this.toast.show('Failed to delete category', 'danger');
        }
      });
  }

  private patchState(partial: Partial<AdminCategoryState>) {
    this.state.update(s => ({ ...s, ...partial }));
  }
}
