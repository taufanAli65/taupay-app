import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import { UserProfile, UpdateUserRequest } from '@shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/user`;

  getMe() {
    return this.http.get<ApiResponse<UserProfile>>(`${this.base}/me`);
  }

  updateMe(body: UpdateUserRequest) {
    return this.http.patch<ApiResponse<void>>(`${this.base}/me`, body);
  }
}
