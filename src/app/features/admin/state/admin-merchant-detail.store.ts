import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { AdminMerchantService } from '../services/admin-merchant.service';
import { MerchantCategory, CreateMerchantRequest, UpdateMerchantRequest } from '@shared/models/merchant.model';
import { Product } from '@shared/models/product.model';

interface AdminMerchantDetailState {
  categories: MerchantCategory[];
  products: Product[];
  loadingProducts: boolean;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  saving: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminMerchantDetailStore {
  private merchantService = inject(AdminMerchantService);

  private state = signal<AdminMerchantDetailState>({
    categories: [],
    products: [],
    loadingProducts: false,
    currentPage: 0,
    totalPages: 1,
    totalElements: 0,
    saving: false
  });

  categories = computed(() => this.state().categories);
  products = computed(() => this.state().products);
  loadingProducts = computed(() => this.state().loadingProducts);
  currentPage = computed(() => this.state().currentPage);
  totalPages = computed(() => this.state().totalPages);
  totalElements = computed(() => this.state().totalElements);
  saving = computed(() => this.state().saving);

  loadCategories() {
    return this.merchantService.getCategories().pipe(
      tap(res => this.patchState({ categories: res.data ?? [] }))
    );
  }

  loadProducts(merchantId: string, page: number, size = 10) {
    this.patchState({ loadingProducts: true });
    return this.merchantService.getMerchantProducts(merchantId, page, size).pipe(
      tap(res => {
        this.patchState({
          products: res.data ?? [],
          currentPage: res.pagination?.page ?? page,
          totalPages: res.pagination?.totalPages ?? 1,
          totalElements: res.pagination?.totalElements ?? 0
        });
      }),
      finalize(() => this.patchState({ loadingProducts: false }))
    );
  }

  saveMerchant(merchantId: string | null | undefined, body: CreateMerchantRequest | UpdateMerchantRequest, isNew: boolean) {
    this.patchState({ saving: true });
    const request = isNew
      ? this.merchantService.create(body as CreateMerchantRequest)
      : this.merchantService.update(merchantId!, body as UpdateMerchantRequest);

    return request.pipe(
      finalize(() => this.patchState({ saving: false }))
    );
  }

  private patchState(partial: Partial<AdminMerchantDetailState>) {
    this.state.update(state => ({ ...state, ...partial }));
  }
}