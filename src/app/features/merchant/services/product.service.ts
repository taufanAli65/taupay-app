import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import { Product, CreateProductRequest, ProductCategory } from '@shared/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1`;

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

    return this.http.get<ApiResponse<Product[]>>(`${this.base}/products`, { params });
  }

  getById(id: string) {
    return this.http.get<ApiResponse<Product>>(`${this.base}/products/${id}`);
  }

  create(data: any, file?: File) {
    const form = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        form.append(key, data[key].toString());
      }
    });
    if (file) form.append('file', file);
    return this.http.post<ApiResponse<Product>>(`${this.base}/products`, form);
  }

  update(id: string, data: any, file?: File) {
    const form = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        form.append(key, data[key].toString());
      }
    });
    if (file) form.append('file', file);
    return this.http.put<ApiResponse<Product>>(`${this.base}/products/${id}`, form);
  }

  activate(id: string) {
    return this.http.patch<ApiResponse<void>>(`${this.base}/products/${id}/activate`, null);
  }

  deactivate(id: string) {
    return this.http.patch<ApiResponse<void>>(`${this.base}/products/${id}/deactive`, null);
  }

  getCategories(search = '') {
    const params = search ? `?search=${search}` : '';
    return this.http.get<ApiResponse<ProductCategory[]>>(`${this.base}/products/categories${params}`);
  }

  getDashboardProducts(size = 5) {
    const params = new HttpParams()
      .set('size', size.toString())
      .set('sortBy', 'updatedAt')
      .set('sortDir', 'desc');
    return this.http.get<ApiResponse<Product[]>>(`${this.base}/products`, { params });
  }

  createCategory(name: string) {
    return this.http.post<ApiResponse<ProductCategory>>(`${this.base}/products/categories`, { name });
  }

  updateCategory(id: string, name: string) {
    return this.http.put<ApiResponse<ProductCategory>>(`${this.base}/products/categories/${id}`, { name });
  }

  deleteCategory(id: string) {
    return this.http.delete<ApiResponse<void>>(`${this.base}/products/categories/${id}`);
  }

  getDeactivatedProducts(page = 0, size = 10, search = '') {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) params = params.set('search', search);

    return this.http.get<ApiResponse<Product[]>>(`${this.base}/products/deactivated`, { params });
  }

  getProductStatistics() {
    return this.http.get<ApiResponse<{ totalProducts: number; activeProducts: number; deactivatedProducts: number }>>(`${this.base}/products/statistics`);
  }
}
