import { Injectable } from '@angular/core';
import { JwtPayload, UserRole } from '@shared/models/auth.model';

const TOKEN_KEY = 'taupay_token';

function safeStorage(): Storage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; }
  catch { return null; }
}

@Injectable({ providedIn: 'root' })
export class TokenStorageService {

  setToken(token: string): void {
    safeStorage()?.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return safeStorage()?.getItem(TOKEN_KEY) ?? null;
  }

  clearToken(): void {
    safeStorage()?.removeItem(TOKEN_KEY);
  }

  getDecodedToken(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }

  isTokenExpired(): boolean {
    const payload = this.getDecodedToken();
    if (!payload) return true;
    return Date.now() >= payload.exp * 1000;
  }

  getRole(): UserRole | null {
    return this.getDecodedToken()?.role ?? null;
  }

  getProfileId(): string | null {
    return this.getDecodedToken()?.profileId ?? null;
  }

  getEmail(): string | null {
    return this.getDecodedToken()?.sub ?? null;
  }
}
