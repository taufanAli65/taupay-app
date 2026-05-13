import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import {
  LoginRequest, LoginResponse,
  RegisterUserRequest, RegisterMerchantRequest,
} from '@shared/models/auth.model';
import { TokenStorageService } from '@core/services/token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenStorageService);

  private readonly base = `${environment.apiUrl}/api/v1/auth`;

  isLoading = signal(false);

  login(body: LoginRequest) {
    this.isLoading.set(true);
    return this.http.post<ApiResponse<LoginResponse>>(`${this.base}/login`, body).pipe(
      tap({
        next: res => {
          this.tokenService.setToken(res.data.token);
          this.isLoading.set(false);
          const role = this.tokenService.getRole();
          if (role === 'USER') this.router.navigate(['/user/dashboard']);
          else if (role === 'MERCHANT') this.router.navigate(['/merchant/dashboard']);
          else if (role === 'SUPER_ADMIN') this.router.navigate(['/admin/dashboard']);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  registerUser(body: RegisterUserRequest) {
    return this.http.post<ApiResponse<any>>(`${this.base}/register`, body);
  }

  registerMerchant(body: RegisterMerchantRequest) {
    return this.http.post<ApiResponse<any>>(`${this.base}/register/merchant`, body);
  }

  logout(): void {
    this.tokenService.clearToken();
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return !!this.tokenService.getToken() && !this.tokenService.isTokenExpired();
  }
}
