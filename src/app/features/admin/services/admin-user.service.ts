import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import { UserProfile } from '@shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/user`;

  getAll(page = 0, size = 10, search = '', filters: { [key: string]: any } = {}) {
    let params = `page=${page}&size=${size}`;
    if (search) params += `&search=${search}`;
    
    Object.keys(filters).forEach(key => {
      const val = filters[key];
      if (val !== undefined && val !== null && val !== '') {
        params += `&${key}=${val}`;
      }
    });

    return this.http.get<ApiResponse<UserProfile[]>>(`${this.base}?${params}`);
  }

  getById(id: string) {
    return this.http.get<ApiResponse<UserProfile>>(`${this.base}/${id}`);
  }

  activate(id: string)   { return this.http.get<ApiResponse<void>>(`${this.base}/${id}/activate`); }
  deactivate(id: string) { return this.http.get<ApiResponse<void>>(`${this.base}/${id}/deactivate`); }
}
