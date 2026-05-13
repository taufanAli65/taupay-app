import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/landing/landing.routes').then(m => m.LANDING_ROUTES)
  },

  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  {
    path: 'user',
    canActivate: [authGuard, roleGuard(['USER'])],
    loadChildren: () => import('./features/user/user.routes').then(m => m.USER_ROUTES)
  },

  {
    path: 'merchant',
    canActivate: [authGuard, roleGuard(['MERCHANT'])],
    loadChildren: () => import('./features/merchant/merchant.routes').then(m => m.MERCHANT_ROUTES)
  },

  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['SUPER_ADMIN'])],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },

  { path: '**', redirectTo: '/' }
];
