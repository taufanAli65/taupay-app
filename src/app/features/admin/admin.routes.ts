import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',         loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'users',             loadComponent: () => import('./users/user-list/user-list.component').then(m => m.AdminUserListComponent) },
      { path: 'users/:id',         loadComponent: () => import('./users/user-detail/user-detail.component').then(m => m.AdminUserDetailComponent) },
      { path: 'merchants',         loadComponent: () => import('./merchants/merchant-list/merchant-list.component').then(m => m.AdminMerchantListComponent) },
      { path: 'merchants/new',     loadComponent: () => import('./merchants/merchant-detail/merchant-detail.component').then(m => m.AdminMerchantDetailComponent) },
      { path: 'merchants/:id',     loadComponent: () => import('./merchants/merchant-detail/merchant-detail.component').then(m => m.AdminMerchantDetailComponent) },
      { path: 'categories',        loadComponent: () => import('./merchants/merchant-category/merchant-category.component').then(m => m.MerchantCategoryComponent) },
      { path: 'products',          loadComponent: () => import('./products/product-list/product-list.component').then(m => m.AdminProductListComponent) },
      { path: 'transactions',      loadComponent: () => import('./transactions/transaction-monitor/transaction-monitor.component').then(m => m.TransactionMonitorComponent) },
    ]
  }
];
