import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';
import { UserRole } from '@shared/models/auth.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const tokenService = inject(TokenStorageService);
    const router = inject(Router);
    const role = tokenService.getRole();

    if (role && allowedRoles.includes(role)) {
      return true;
    }

    // Redirect to appropriate home based on actual role
    if (role === 'USER') return router.createUrlTree(['/user/dashboard']);
    if (role === 'MERCHANT') return router.createUrlTree(['/merchant/dashboard']);
    if (role === 'SUPER_ADMIN') return router.createUrlTree(['/admin/dashboard']);

    return router.createUrlTree(['/auth/login']);
  };
};
