import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Observer } from 'rxjs';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api-response.model';
import {
  Transaction,
  CreateTransactionRequest,
  PaymentCallback,
  TransactionHistoryItem,
  TransactionStatusEvent
} from '@shared/models/transaction.model';
import { TokenStorageService } from '@core/services/token-storage.service';

const PENDING_TRANSACTION_KEY = 'taupay_pending_trx';

function safeStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private base = `${environment.apiUrl}/api/v1/transactions`;
  private merchantBase = `${environment.apiUrl}/api/v1/merchant/transactions`;

  create(body: CreateTransactionRequest) {
    return this.http.post<ApiResponse<Transaction>>(this.base, body);
  }

  sendCallback(body: PaymentCallback) {
    return this.http.post<ApiResponse<void>>(
      `${this.base}/${encodeURIComponent(body.trx_id)}/callback`, 
      body, 
      { withCredentials: true }
    );
  }

  getTransactionDetails(trxId: string) {
    return this.http.get<ApiResponse<Transaction>>(`${this.base}/${encodeURIComponent(trxId)}`);
  }

  getHistory(startDate?: string, endDate?: string, page = 0, size = 10) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ApiResponse<TransactionHistoryItem[]>>(this.merchantBase, { params });
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
      const url = `${environment.apiUrl}/api/v1/transactions/${encodeURIComponent(trxId)}/status`;
      void this.streamStatus(url, token, controller, observer);

      return () => controller.abort();
    });
  }

  savePendingTransaction(transaction: Transaction): void {
    const storage = safeStorage();
    if (!storage) return;

    storage.setItem(PENDING_TRANSACTION_KEY, JSON.stringify({
      ...transaction,
      id: transaction.trx_id,
      amount: transaction.total,
      status: 'PENDING'
    }));
  }

  getPendingTransaction(trxId?: string): Transaction | null {
    const storage = safeStorage();
    if (!storage) return null;

    const raw = storage.getItem(PENDING_TRANSACTION_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (!isTransaction(parsed)) return null;
      if (trxId && parsed.trx_id !== trxId) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  clearPendingTransaction(trxId?: string): void {
    const storage = safeStorage();
    if (!storage) return;

    if (!trxId) {
      storage.removeItem(PENDING_TRANSACTION_KEY);
      return;
    }

    const current = this.getPendingTransaction(trxId);
    if (current) {
      storage.removeItem(PENDING_TRANSACTION_KEY);
    }
  }

  private async streamStatus(
    url: string,
    token: string,
    controller: AbortController,
    observer: Observer<TransactionStatusEvent>
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store',
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Status stream failed with ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Status stream did not return a body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split(/\r?\n\r?\n/);
        buffer = messages.pop() ?? '';

        for (const message of messages) {
          this.handleSseMessage(message, observer);
        }
      }

      if (buffer.trim()) {
        this.handleSseMessage(buffer, observer);
      }

      observer.complete();
    } catch (error) {
      if (!controller.signal.aborted) {
        observer.error(error);
      }
    }
  }

  private handleSseMessage(message: string, observer: Observer<TransactionStatusEvent>): void {
    const lines = message.split(/\r?\n/);
    let eventName = 'message';
    const dataLines: string[] = [];

    for (const line of lines) {
      if (!line || line.startsWith(':')) continue;

      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
        continue;
      }

      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }

    if ((eventName !== 'payment' && eventName !== 'expired') || dataLines.length === 0) {
      return;
    }

    try {
      const payload = JSON.parse(dataLines.join('\n')) as TransactionStatusEvent;
      if (isTransactionStatusEvent(payload)) {
        observer.next(payload);
      }
    } catch {
      observer.error(new Error('Failed to parse transaction status event'));
    }
  }
}

function isTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<Transaction>;
  return typeof candidate.trx_id === 'string'
    && typeof candidate.merchant_id === 'string'
    && typeof candidate.created_at === 'string'
    && typeof candidate.total === 'number'
    && Array.isArray(candidate.products);
}

function isTransactionStatusEvent(value: unknown): value is TransactionStatusEvent {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<TransactionStatusEvent>;
  return typeof candidate.trx_id === 'string'
    && (candidate.status === 'PAID' || candidate.status === 'FAILED' || candidate.status === 'EXPIRED');
}
