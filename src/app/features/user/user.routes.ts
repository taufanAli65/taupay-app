import { Routes } from '@angular/router';
import { UserLayoutComponent } from './layout/user-layout.component';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: UserLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.UserDashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.UserProfileComponent)
      },
      {
        path: 'transactions/history',
        loadComponent: () => import('./transactions/transaction-history/transaction-history.component').then(m => m.UserTransactionHistoryComponent)
      },
      {
        path: 'transactions/pay',
        loadComponent: () => import('./transactions/pay/pay.component').then(m => m.UserPayComponent)
      }
    ]
  }
];
