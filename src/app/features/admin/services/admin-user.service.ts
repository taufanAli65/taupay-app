import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import { UserProfile } from '@shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/admin/users`;

  getAll(page = 0, size = 10) {
    return this.http.get<ApiResponse<UserProfile[]>>(`${this.base}/?page=${page}&size=${size}`);
  }

  getById(id: string) {
    return this.http.get<ApiResponse<UserProfile>>(`${this.base}/${id}`);
  }

  activate(id: string)   { return this.http.get<ApiResponse<void>>(`${this.base}/${id}/activate`); }
  deactivate(id: string) { return this.http.get<ApiResponse<void>>(`${this.base}/${id}/deactivate`); }
}
