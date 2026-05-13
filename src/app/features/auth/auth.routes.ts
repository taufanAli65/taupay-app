import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
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
