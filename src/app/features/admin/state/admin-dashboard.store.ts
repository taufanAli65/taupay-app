import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminUserService } from '../services/admin-user.service';
import { AdminMerchantService } from '../services/admin-merchant.service';
import { AdminProductService } from '../services/admin-product.service';
import { finalize, forkJoin } from 'rxjs';

interface AdminDashboardState {
  userStats: { total: number; active: number; deactivated: number } | null;
  merchantStats: { total: number; active: number; deactivated: number } | null;
  productStats: { total: number; active: number; deactivated: number } | null;
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardStore {
  private userService = inject(AdminUserService);
  private merchantService = inject(AdminMerchantService);
  private productService = inject(AdminProductService);
  private destroyRef = inject(DestroyRef);

  private state = signal<AdminDashboardState>({
    userStats: null,
    merchantStats: null,
    productStats: null,
    loading: false
  });

  userStats = computed(() => this.state().userStats);
  merchantStats = computed(() => this.state().merchantStats);
  productStats = computed(() => this.state().productStats);
  loading = computed(() => this.state().loading);

  loadDashboardData() {
    this.patchState({ loading: true });

    forkJoin({
      users: this.userService.getStatistics(),
      merchants: this.merchantService.getStatistics(),
      products: this.productService.getStatistics()
    }).pipe(
      finalize(() => this.patchState({ loading: false })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.patchState({
          userStats: res.users.data,
          merchantStats: res.merchants.data,
          productStats: res.products.data
        });
      },
      error: () => {}
    });
  }

  private patchState(partial: Partial<AdminDashboardState>) {
    this.state.update(s => ({ ...s, ...partial }));
  }
}
