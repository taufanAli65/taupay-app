import { Component, inject, OnInit, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TransactionService } from '@features/merchant/services/transaction.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { Transaction, TransactionStatusEvent } from '@shared/models/transaction.model';
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
  private router = inject(Router);
  private transactionService = inject(TransactionService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  trxId = '';
  transaction = signal<Transaction | null>(null);
  status = signal<'waiting' | 'paid' | 'failed' | 'expired'>('waiting');
  paying = signal(false);
  private sseSub?: Subscription;
  private redirectTimer?: ReturnType<typeof setTimeout>;
  private terminalHandled = false;

  get statusLabel(): string {
    return {
      waiting: 'Awaiting Payment',
      paid: 'Paid',
      failed: 'Failed',
      expired: 'Expired'
    }[this.status()];
  }

  ngOnInit(): void {
    this.trxId = this.route.snapshot.paramMap.get('trxId') ?? '';

    if (!isPlatformBrowser(this.platformId) || !this.trxId) {
      return;
    }

    const restoredTransaction = this.restoreTransaction();
    if (restoredTransaction) {
      this.transactionService.savePendingTransaction(restoredTransaction);
    } else {
      this.toast.show('Transaction details could not be restored. Waiting for live status only.', 'warning');
    }

    this.sseSub = this.transactionService.subscribeToStatus(this.trxId).subscribe({
      next: event => this.handleStatusEvent(event),
      error: () => {
        if (this.terminalHandled) return;
        this.toast.show('Live payment status connection was lost.', 'warning');
      },
      complete: () => {
        if (!this.terminalHandled) {
          this.toast.show('Live payment status stream closed before a final update arrived.', 'warning');
        }
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
      error: () => {
        this.toast.show('Payment simulation failed.', 'warning');
        this.paying.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopStatusStream();
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
  }

  private restoreTransaction(): Transaction | null {
    const stateTrx = history.state?.transaction as Transaction | undefined;
    if (stateTrx?.trx_id === this.trxId) {
      this.transaction.set(stateTrx);
      return stateTrx;
    }

    const pendingTrx = this.transactionService.getPendingTransaction(this.trxId);
    if (pendingTrx) {
      this.transaction.set(pendingTrx);
      return pendingTrx;
    }

    return null;
  }

  private handleStatusEvent(event: TransactionStatusEvent): void {
    if (event.trx_id !== this.trxId || this.terminalHandled) {
      return;
    }

    if (event.status === 'PAID') {
      this.status.set('paid');
      this.finalizeStatus('Payment received. Redirecting to transaction history...', ['/merchant/transactions/history'], 'success');
      return;
    }

    if (event.status === 'FAILED') {
      this.status.set('failed');
      this.finalizeStatus('Payment failed. Redirecting to create a new transaction...', ['/merchant/transactions/new'], 'danger');
      return;
    }

    this.status.set('expired');
    this.finalizeStatus('QR payment expired. Redirecting to create a new transaction...', ['/merchant/transactions/new'], 'warning');
  }

  private finalizeStatus(
    message: string,
    commands: string[],
    toastType: 'success' | 'danger' | 'warning'
  ): void {
    this.terminalHandled = true;
    this.transactionService.clearPendingTransaction(this.trxId);
    this.stopStatusStream();
    this.toast.show(message, toastType);
    this.redirectTimer = setTimeout(() => {
      void this.router.navigate(commands);
    }, 1500);
  }

  private stopStatusStream(): void {
    this.sseSub?.unsubscribe();
    this.sseSub = undefined;
  }
}
