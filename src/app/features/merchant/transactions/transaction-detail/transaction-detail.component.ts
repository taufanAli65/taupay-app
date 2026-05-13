import { Component, inject, OnInit, OnDestroy, signal, Input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TransactionService } from '@features/merchant/services/transaction.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { Transaction } from '@shared/models/transaction.model';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import { Subscription } from 'rxjs';
import { QRCodeModule } from 'angularx-qrcode';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyIdrPipe, QRCodeModule, IconComponent],
  templateUrl: './transaction-detail.component.html'
})
export class TransactionDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private transactionService = inject(TransactionService);
  private toast = inject(ToastService);

  trxId = '';
  transaction = signal<Transaction | null>(null);
  status = signal<'waiting' | 'paid' | 'failed'>('waiting');
  paying = signal(false);
  private sseSub?: Subscription;

  get statusLabel(): string {
    return { waiting: 'Awaiting Payment', paid: 'Paid', failed: 'Failed' }[this.status()];
  }

  ngOnInit(): void {
    this.trxId = this.route.snapshot.paramMap.get('trxId') ?? '';
    
    // Load transaction from router state since backend has no GET by ID
    const stateTrx = history.state.transaction;
    if (stateTrx) {
      this.transaction.set(stateTrx);
    }

    // SSE subscription for real-time updates
    this.sseSub = this.transactionService.subscribeToEvents(this.trxId).subscribe({
      next: data => {
        if (data.includes('PAID')) this.status.set('paid');
        else if (data.includes('FAILED')) this.status.set('failed');
      }
    });
  }

  simulatePay(): void {
    this.paying.set(true);
    this.transactionService.sendCallback({
      trx_id: this.trxId,
      status: 'PAID',
      payer_user_id: '00000000-0000-0000-0000-000000000000'
    }).subscribe({
      next: () => { this.status.set('paid'); this.toast.show('Payment simulated!', 'success'); this.paying.set(false); },
      error: () => this.paying.set(false)
    });
  }

  ngOnDestroy(): void { this.sseSub?.unsubscribe(); }
}
