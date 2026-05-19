import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { ProductService } from '../services/product.service';
import { ProductCategory } from '@shared/models/product.model';

interface ProductFormState {
  categories: ProductCategory[];
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductFormStore {
  private productService = inject(ProductService);

  private state = signal<ProductFormState>({
    categories: [],
    loading: false
  });

  categories = computed(() => this.state().categories);
  loading = computed(() => this.state().loading);

  loadCategories() {
    return this.productService.getCategories().pipe(
      tap(res => this.patchState({ categories: res.data ?? [] }))
    );
  }

  loadProduct(id: string) {
    this.patchState({ loading: true });
    return this.productService.getById(id).pipe(
      finalize(() => this.patchState({ loading: false }))
    );
  }

  saveProduct(id: string | null | undefined, data: any, file?: File, isEdit = false) {
    this.patchState({ loading: true });
    const request = isEdit && id
      ? this.productService.update(id, data, file)
      : this.productService.create(data, file);

    return request.pipe(
      finalize(() => this.patchState({ loading: false }))
    );
  }

  private patchState(partial: Partial<ProductFormState>) {
    this.state.update(state => ({ ...state, ...partial }));
  }
}