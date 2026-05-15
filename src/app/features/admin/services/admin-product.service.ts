import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import { Product } from '@shared/models/product.model';

@Injectable({ providedIn: 'root' })
export class AdminProductService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/admin/products`;

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

    return this.http.get<ApiResponse<Product[]>>(this.base, { params });
  }

  getById(id: string) {
    return this.http.get<ApiResponse<Product>>(`${this.base}/${id}`);
  }

  activate(id: string)   { return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/activate`, null); }
  deactivate(id: string) { return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/deactive`, null); }
}
