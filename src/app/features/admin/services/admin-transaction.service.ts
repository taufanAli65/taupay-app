import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env';

@Injectable({ providedIn: 'root' })
export class AdminTransactionService {
  private base = `${environment.apiUrl}/api/v1/admin/transactions`;

  /** SSE stream for transaction events */
  subscribeToEvents(trxId: string): Observable<MessageEvent> {
    return new Observable(observer => {
      const es = new EventSource(`${this.base}/${trxId}/events`);
      es.onmessage = e => observer.next(e);
      es.onerror   = e => { observer.error(e); es.close(); };
      return () => es.close();
    });
  }
}
