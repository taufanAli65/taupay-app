import { Routes } from '@angular/router';
import { MerchantLayoutComponent } from './layout/merchant-layout.component';

export const MERCHANT_ROUTES: Routes = [
  {
    path: '',
    component: MerchantLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.MerchantDashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./products/product-list/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: 'products/new',
        loadComponent: () => import('./products/product-form/product-form.component').then(m => m.ProductFormComponent)
      },
      {
        path: 'products/:id/edit',
        loadComponent: () => import('./products/product-form/product-form.component').then(m => m.ProductFormComponent)
      },
      {
        path: 'transactions/new',
        loadComponent: () => import('./transactions/create-transaction/create-transaction.component').then(m => m.CreateTransactionComponent)
      },
      {
        path: 'transactions/history',
        loadComponent: () => import('./transactions/transaction-history/transaction-history.component').then(m => m.TransactionHistoryComponent)
      },
      {
        path: 'transactions/:trxId',
        loadComponent: () => import('./transactions/transaction-detail/transaction-detail.component').then(m => m.TransactionDetailComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/merchant-profile.component').then(m => m.MerchantProfileComponent)
      }
    ]
  }
];
