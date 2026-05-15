import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import { Product, CreateProductRequest, ProductCategory } from '@shared/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1`;

  getAll(page = 0, size = 10) {
    return this.http.get<ApiResponse<Product[]>>(`${this.base}/products?page=${page}&size=${size}`);
  }

  getById(id: string) {
    return this.http.get<ApiResponse<Product>>(`${this.base}/products/${id}`);
  }

  create(data: CreateProductRequest, file?: File) {
    const form = new FormData();
    form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (file) form.append('file', file);
    return this.http.post<ApiResponse<Product>>(`${this.base}/products`, form);
  }

  update(id: string, data: CreateProductRequest, file?: File) {
    const form = new FormData();
    form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (file) form.append('file', file);
    return this.http.put<ApiResponse<Product>>(`${this.base}/products/${id}`, form);
  }

  activate(id: string) {
    return this.http.patch<ApiResponse<void>>(`${this.base}/products/${id}/activate`, {});
  }

  deactivate(id: string) {
    return this.http.patch<ApiResponse<void>>(`${this.base}/products/${id}/deactive`, {});
  }

  getCategories() {
    return this.http.get<ApiResponse<ProductCategory[]>>(`${this.base}/products/categories`);
  }
}
