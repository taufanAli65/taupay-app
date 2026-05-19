import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenStorageService } from '../services/token-storage.service';
import { ToastService } from '@shared/components/toast/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokenService = inject(TokenStorageService);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError(err => {
      const status = err.status;
      const message = err.error?.message || 'An unexpected error occurred.';
      const normalizedMessage = message.toLowerCase();

      if (status === 423) {
        tokenService.clearToken();
        router.navigate(['/auth/account-locked'], { queryParams: { message } });
      } else if (status === 401 && normalizedMessage.includes('inactive')) {
        tokenService.clearToken();
        router.navigate(['/auth/account-inactive'], { queryParams: { message } });
      } else if (status === 401) {
        tokenService.clearToken();
        router.navigate(['/auth/login']);
        toast.show('Session expired. Please login again.', 'warning');
      } else if (status === 403) {
        toast.show(message, 'danger');
      } else if (status === 404) {
        toast.show('Resource not found.', 'warning');
      } else if (status === 400) {
        toast.show(message, 'danger');
      } else if (status >= 500) {
        toast.show('Server error. Please try again later.', 'danger');
      }

      return throwError(() => err);
    })
  );
};
