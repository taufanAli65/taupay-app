import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import { MerchantProfile, MerchantCategory, CreateMerchantRequest, UpdateMerchantRequest } from '@shared/models/merchant.model';
import { Product } from '@shared/models/product.model';

@Injectable({ providedIn: 'root' })
export class AdminMerchantService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/admin/merchant`;

  getAll(page = 0, size = 10, search = '', filters: { [key: string]: any } = {}) {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) params = params.set('search', search);
    
    Object.keys(filters).forEach(key => {
      const val = filters[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });

    return this.http.get<ApiResponse<MerchantProfile[]>>(this.base, { params });
  }

  getStatistics() {
    return this.http.get<ApiResponse<{ total: number; active: number; deactivated: number }>>(`${this.base}/statistics`);
  }

  getCategories(search = '') {
    const params = search ? `?search=${search}` : '';
    return this.http.get<ApiResponse<MerchantCategory[]>>(`${environment.apiUrl}/api/v1/merchant/category${params}`);
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

  getMerchantProducts(merchantId: string, page = 0, size = 10) {
    return this.http.get<ApiResponse<Product[]>>(`${environment.apiUrl}/api/v1/admin/merchant/${merchantId}/products?page=${page}&size=${size}`);
  }

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
