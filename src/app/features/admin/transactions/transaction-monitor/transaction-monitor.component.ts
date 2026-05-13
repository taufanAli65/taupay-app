import { Component, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminTransactionService } from '@features/admin/services/admin-transaction.service';
import { Subscription } from 'rxjs';
import { IconComponent } from '@shared/components/icon/icon.component';

interface SseEvent {
  timestamp: Date;
  data: string;
  type: 'info' | 'success' | 'warning';
}

@Component({
  selector: 'app-transaction-monitor',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './transaction-monitor.component.html'
})
export class TransactionMonitorComponent implements OnDestroy {
  private txnService = inject(AdminTransactionService);
  events = signal<SseEvent[]>([]);
  connected = signal(false);
  trxId = '';
  private sub?: Subscription;

  connect(): void {
    if (!this.trxId.trim()) return;
    this.connected.set(true);
    this.sub = this.txnService.subscribeToEvents(this.trxId).subscribe({
      next: (ev: MessageEvent) => {
        const data = ev.data ?? String(ev);
        const type: SseEvent['type'] = data.includes('PAID') ? 'success' : data.includes('FAILED') ? 'warning' : 'info';
        this.events.update(es => [...es, { timestamp: new Date(), data, type }]);
      },
      error: () => { this.connected.set(false); }
    });
  }

  disconnect(): void {
    this.sub?.unsubscribe();
    this.connected.set(false);
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
