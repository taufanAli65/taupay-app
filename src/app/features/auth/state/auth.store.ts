import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, tap } from 'rxjs';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import { LoginRequest, RegisterMerchantRequest } from '@shared/models/auth.model';
import { MerchantCategory } from '@shared/models/merchant.model';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private state = signal({
    loading: false,
    merchantCategories: [] as MerchantCategory[]
  });

  loading = computed(() => this.state().loading);
  categories = computed(() => this.state().merchantCategories);

  loadMerchantCategories() {
    return this.http.get<ApiResponse<MerchantCategory[]>>(
      `${environment.apiUrl}/api/v1/merchant/category`
    ).pipe(
      tap(res => this.patchState({ merchantCategories: res.data ?? [] }))
    );
  }

  login(body: LoginRequest) {
    this.patchState({ loading: true });
    return this.authService.login(body).pipe(
      finalize(() => this.patchState({ loading: false }))
    );
  }

  registerMerchant(body: RegisterMerchantRequest) {
    this.patchState({ loading: true });
    return this.authService.registerMerchant(body).pipe(
      finalize(() => this.patchState({ loading: false }))
    );
  }

  private patchState(partial: Partial<{ loading: boolean; merchantCategories: MerchantCategory[] }>) {
    this.state.update(state => ({ ...state, ...partial }));
  }
}