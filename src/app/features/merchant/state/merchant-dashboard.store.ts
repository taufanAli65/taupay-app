import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MerchantService } from '../services/merchant.service';
import { ProductService } from '../services/product.service';
import { MerchantProfile } from '@shared/models/merchant.model';
import { MerchantDashboardData } from '@shared/models/merchant.model';
import { Product } from '@shared/models/product.model';
import { TransactionHistoryItem } from '@shared/models/transaction.model';
import { TransactionService } from '../services/transaction.service';
import { finalize, forkJoin } from 'rxjs';

interface DashboardState {
  merchant: MerchantProfile | null;
  recentProducts: Product[];
  recentTransactions: TransactionHistoryItem[];
  totalTransactionElements: number;
  dashboardData: MerchantDashboardData | null;
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class MerchantDashboardStore {
  private merchantService = inject(MerchantService);
  private productService = inject(ProductService);
  private transactionService = inject(TransactionService);
  private destroyRef = inject(DestroyRef);

  // --- STATE ---
  private state = signal<DashboardState>({
    merchant: null,
    recentProducts: [],
    recentTransactions: [],
    totalTransactionElements: 0,
    dashboardData: null,
    loading: false
  });

  // --- SELECTORS ---
  merchant = computed(() => this.state().merchant);
  recentProducts = computed(() => this.state().recentProducts);
  recentTransactions = computed(() => this.state().recentTransactions);
  loading = computed(() => this.state().loading);
  dashboardData = computed(() => this.state().dashboardData as MerchantDashboardData | null);
  financial = computed(() => this.state().dashboardData?.financial ?? null);
  revenueTrend = computed(() => this.state().dashboardData?.revenueTrend ?? []);
  topProducts = computed(() => this.state().dashboardData?.topProducts ?? []);
  lowStockProducts = computed(() => this.state().dashboardData?.lowStockProducts ?? []);

  totalProducts = computed(() => this.state().dashboardData?.financial?.totalProducts ?? 0);
  activeProductsCount = computed(() => this.state().dashboardData?.financial?.activeProducts ?? 0);
  deactivatedProducts = computed(() => this.state().dashboardData?.financial?.deactivatedProducts ?? 0);
  totalElements = computed(() => this.state().totalTransactionElements);

  // --- ACTIONS ---
  loadDashboardData() {
    this.patchState({ loading: true });

    forkJoin({
      profile: this.merchantService.getMe(),
      products: this.productService.getDashboardProducts(5),
      transactions: this.transactionService.getHistory(undefined, undefined, 0, 5),
      dashboard: this.merchantService.getDashboard()
    }).pipe(
      finalize(() => this.patchState({ loading: false })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.patchState({
          merchant: res.profile.data,
          recentProducts: res.products.data ?? [],
          recentTransactions: res.transactions.data ?? [],
          totalTransactionElements: res.transactions.pagination?.totalElements ?? (res.transactions.data?.length ?? 0),
          dashboardData: res.dashboard.data ?? null
        });
      },
      error: () => {}
    });
  }

  private patchState(partial: Partial<DashboardState>) {
    this.state.update(s => ({ ...s, ...partial }));
  }
}
