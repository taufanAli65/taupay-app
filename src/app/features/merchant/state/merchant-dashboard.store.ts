import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MerchantService } from '../services/merchant.service';
import { ProductService } from '../services/product.service';
import { MerchantProfile } from '@shared/models/merchant.model';
import { Product } from '@shared/models/product.model';
import { finalize, forkJoin } from 'rxjs';

interface DashboardState {
  merchant: MerchantProfile | null;
  recentProducts: Product[];
  totalElements: number;
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class MerchantDashboardStore {
  private merchantService = inject(MerchantService);
  private productService = inject(ProductService);
  private destroyRef = inject(DestroyRef);

  // --- STATE ---
  private state = signal<DashboardState>({
    merchant: null,
    recentProducts: [],
    totalElements: 5,
    loading: false
  });

  // --- SELECTORS ---
  merchant = computed(() => this.state().merchant);
  recentProducts = computed(() => this.state().recentProducts);
  loading = computed(() => this.state().loading);
  totalElements = computed(() => this.state().totalElements);

  // Derivasi data (Computed Stats)
  totalProducts = computed(() => this.state().recentProducts.length); // Sementara dari list yang ada
  activeProductsCount = computed(() => 
    this.state().recentProducts.filter(p => p.isActive).length
  );

  // --- ACTIONS ---
  loadDashboardData() {
    this.patchState({ loading: true });

    // Gunakan forkJoin agar loading selesai saat kedua API beres
    forkJoin({
      profile: this.merchantService.getMe(),
      products: this.productService.getDashboardProducts(5)
    }).pipe(
      finalize(() => this.patchState({ loading: false })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.patchState({
          merchant: res.profile.data,
          recentProducts: res.products.data ?? [],
        });
      },
      error: () => {
        // Error dihandle oleh global interceptor
      }
    });
  }

  private patchState(partial: Partial<DashboardState>) {
    this.state.update(s => ({ ...s, ...partial }));
  }
}
