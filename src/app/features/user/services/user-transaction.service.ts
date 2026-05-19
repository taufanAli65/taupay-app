import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Observer } from 'rxjs';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import {
  PaymentCallback,
  TransactionHistoryItem,
  TransactionStatusEvent
} from '@shared/models/transaction.model';
import { TokenStorageService } from '@core/services/token-storage.service';

@Injectable({ providedIn: 'root' })
export class UserTransactionService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private base = `${environment.apiUrl}/api/v1/user/transactions`;
  private transactionBase = `${environment.apiUrl}/api/v1/transactions`;

  getHistory(startDate?: string, endDate?: string, page = 0, size = 10) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ApiResponse<TransactionHistoryItem[]>>(this.base, { params });
  }

  getTransactionDetail(trxId: string) {
    return this.http.get<ApiResponse<any>>(`${this.transactionBase}/${trxId}`);
  }

  sendCallback(body: PaymentCallback) {
    return this.http.post<ApiResponse<void>>(
      `${this.transactionBase}/${encodeURIComponent(body.trx_id)}/callback`, 
      body,
      { withCredentials: true }
    );
  }

  subscribeToStatus(trxId: string): Observable<TransactionStatusEvent> {
    return new Observable(observer => {
      const token = this.tokenStorage.getToken();
      if (!token) {
        observer.error(new Error('Missing authentication token'));
        return;
      }

      if (typeof fetch === 'undefined' || typeof AbortController === 'undefined') {
        observer.error(new Error('SSE is not available in this environment'));
        return;
      }

      const controller = new AbortController();
      const url = `${this.transactionBase}/${encodeURIComponent(trxId)}/status`;
      void this.streamStatus(url, token, controller, observer);

      return () => controller.abort();
    });
  }

  private async streamStatus(
    url: string,
    token: string,
    controller: AbortController,
    observer: Observer<TransactionStatusEvent>
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        observer.error(new Error(`HTTP ${response.status}`));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5));
              observer.next(data);
              if (data.status === 'COMPLETED' || data.status === 'FAILED') {
                observer.complete();
                return;
              }
            } catch {
              // Ignore JSON parse errors
            }
          }
        }
      }

      observer.complete();
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        observer.error(err);
      }
    }
  }
}
