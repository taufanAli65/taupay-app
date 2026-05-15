import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import { MerchantProfile, MerchantCategory, CreateMerchantRequest, UpdateMerchantRequest } from '@shared/models/merchant.model';

@Injectable({ providedIn: 'root' })
export class AdminMerchantService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/admin/merchant`;

  getAll(page = 0, size = 10) {
    return this.http.get<ApiResponse<MerchantProfile[]>>(`${this.base}?page=${page}&size=${size}`);
  }

  getById(id: string) {
    return this.http.get<ApiResponse<MerchantProfile>>(`${this.base}/${id}`);
  }

  create(body: CreateMerchantRequest) {
    return this.http.post<ApiResponse<MerchantProfile>>(this.base, body);
  }

  update(id: string, body: UpdateMerchantRequest) {
    return this.http.put<ApiResponse<MerchantProfile>>(`${this.base}/${id}`, body);
  }

  activate(id: string)   { return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/activate`, {}); }
  deactivate(id: string) { return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/deactivate`, {}); }

  // Merchant categories
  createCategory(name: string) {
    return this.http.post<ApiResponse<MerchantCategory>>(`${this.base}/category`, { name });
  }
  updateCategory(id: string, name: string) {
    return this.http.patch<ApiResponse<void>>(`${this.base}/category/${id}`, { name });
  }
  deleteCategory(id: string) {
    return this.http.delete<ApiResponse<void>>(`${this.base}/category/${id}`);
  }
}
