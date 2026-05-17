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
  stats: {
    totalProducts: number;
    activeProducts: number;
    deactivatedProducts: number;
  } | null;
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
    stats: null,
    loading: false
  });

  // --- SELECTORS ---
  merchant = computed(() => this.state().merchant);
  recentProducts = computed(() => this.state().recentProducts);
  loading = computed(() => this.state().loading);
  
  totalProducts = computed(() => this.state().stats?.totalProducts ?? 0);
  activeProductsCount = computed(() => this.state().stats?.activeProducts ?? 0);
  totalElements = computed(() => this.state().stats?.totalProducts ?? 0);

  // --- ACTIONS ---
  loadDashboardData() {
    this.patchState({ loading: true });

    forkJoin({
      profile: this.merchantService.getMe(),
      products: this.productService.getDashboardProducts(5),
      stats: this.productService.getProductStatistics()
    }).pipe(
      finalize(() => this.patchState({ loading: false })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.patchState({
          merchant: res.profile.data,
          recentProducts: res.products.data ?? [],
          stats: res.stats.data
        });
      },
      error: () => {}
    });
  }

  private patchState(partial: Partial<DashboardState>) {
    this.state.update(s => ({ ...s, ...partial }));
  }
}
