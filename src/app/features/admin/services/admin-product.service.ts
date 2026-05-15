import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import { Product } from '@shared/models/product.model';

@Injectable({ providedIn: 'root' })
export class AdminProductService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/admin/products`;

  getAll(page = 0, size = 10) {
    return this.http.get<ApiResponse<Product[]>>(`${this.base}?page=${page}&size=${size}`);
  }

  getById(id: string) {
    return this.http.get<ApiResponse<Product>>(`${this.base}/${id}`);
  }

  activate(id: string)   { return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/activate`, {}); }
  deactivate(id: string) { return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/deactive`, {}); }
}
