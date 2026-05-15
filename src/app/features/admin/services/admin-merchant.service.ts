import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import { MerchantProfile, MerchantCategory, CreateMerchantRequest, UpdateMerchantRequest } from '@shared/models/merchant.model';

@Injectable({ providedIn: 'root' })
export class AdminMerchantService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/admin/merchant`;

  getAll(page = 0, size = 10, search = '', filters: { [key: string]: any } = {}) {
    let params = `page=${page}&size=${size}`;
    if (search) params += `&search=${search}`;
    
    Object.keys(filters).forEach(key => {
      const val = filters[key];
      if (val !== undefined && val !== null && val !== '') {
        params += `&${key}=${val}`;
      }
    });

    return this.http.get<ApiResponse<MerchantProfile[]>>(`${this.base}?${params}`);
  }

  getCategories() {
    return this.http.get<ApiResponse<MerchantCategory[]>>(`${environment.apiUrl}/api/v1/merchant/category`);
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

  activate(id: string)   { return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/activate`, null); }
  deactivate(id: string) { return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/deactivate`, null); }

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
