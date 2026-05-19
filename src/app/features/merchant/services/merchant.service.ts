import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import { MerchantProfile, UpdateMerchantRequest, MerchantCategory } from '@shared/models/merchant.model';
import { MerchantDashboardData } from '@shared/models/merchant.model';

@Injectable({ providedIn: 'root' })
export class MerchantService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/merchant`;

  getMe() {
    return this.http.get<ApiResponse<MerchantProfile>>(`${this.base}/me`);
  }

  updateMe(body: UpdateMerchantRequest) {
    return this.http.put<ApiResponse<MerchantProfile>>(`${this.base}/me`, body);
  }

  getCategories() {
    return this.http.get<ApiResponse<MerchantCategory[]>>(`${this.base}/category`);
  }

  getDashboard() {
    return this.http.get<ApiResponse<MerchantDashboardData>>(`${this.base}/dashboard`);
  }
}
