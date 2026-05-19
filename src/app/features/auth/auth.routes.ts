import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'account-locked',
    loadComponent: () => import('./account-locked/account-locked.component').then(m => m.AccountLockedComponent)
  },
  {
    path: 'account-inactive',
    loadComponent: () => import('./account-inactive/account-inactive.component').then(m => m.AccountInactiveComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'register-merchant',
    loadComponent: () => import('./register-merchant/register-merchant.component').then(m => m.RegisterMerchantComponent)
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
