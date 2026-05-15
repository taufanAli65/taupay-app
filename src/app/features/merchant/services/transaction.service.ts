import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import { Transaction, CreateTransactionRequest, PaymentCallback, TransactionHistoryItem } from '@shared/models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/v1/transactions`;
  private merchantBase = `${environment.apiUrl}/api/v1/merchant/transactions`;

  create(body: CreateTransactionRequest) {
    return this.http.post<ApiResponse<Transaction>>(this.base, body);
  }

  sendCallback(body: PaymentCallback) {
    return this.http.post<ApiResponse<void>>(`${this.base}/callback`, body);
  }

  getHistory(startDate?: string, endDate?: string, page = 0, size = 10) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ApiResponse<TransactionHistoryItem[]>>(this.merchantBase, { params });
  }

  /** SSE stream — native EventSource */
  subscribeToEvents(trxId: string): Observable<string> {
    return new Observable(observer => {
      const token = localStorage.getItem('taupay_token') ?? '';
      const url = `${environment.apiUrl}/api/v1/admin/transactions/${trxId}/events`;
      const es = new EventSource(url);

      es.onmessage = e => observer.next(e.data);
      es.onerror = e => { observer.error(e); es.close(); };

      return () => es.close();
    });
  }
}
