import { Component, inject, OnInit, OnDestroy, PLATFORM_ID, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [CommonModule, RouterLink, ReactiveFormsModule, CurrencyIdrPipe, QRCodeModule, IconComponent],
  templateUrl: './transaction-detail.component.html'
})
export class TransactionDetailComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private transactionService = inject(TransactionService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  trxId = '';
  transaction = signal<Transaction | null>(null);
  status = signal<'waiting' | 'paid' | 'failed' | 'expired'>('waiting');
  paying = signal(false);

  countdown = signal(300);
  countdownDisplay = computed(() => {
    const min = Math.floor(this.countdown() / 60);
    const sec = this.countdown() % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  });

  payForm = this.fb.group({
    pin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  private sseSub?: Subscription;
  private redirectTimer?: ReturnType<typeof setTimeout>;
  private countdownTimer?: ReturnType<typeof setInterval>;
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

    this.startCountdown();

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
    if (this.payForm.invalid) {
      this.payForm.markAllAsTouched();
      return;
    }

    this.paying.set(true);
    this.transactionService.sendCallback({
      trx_id: this.trxId,
      pin: this.payForm.getRawValue().pin ?? '',
      status: 'PAID'
    }).subscribe({
      next: () => { this.status.set('paid'); this.toast.show('Payment submitted!', 'success'); this.paying.set(false); },
      error: () => {
        this.paying.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopStatusStream();
    this.stopCountdown();
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
  }

  private startCountdown(): void {
    this.stopCountdown();
    this.countdownTimer = setInterval(() => {
      if (this.status() !== 'waiting') {
        this.stopCountdown();
        return;
      }
      
      if (this.countdown() <= 0) {
        this.status.set('expired');
        this.stopCountdown();
        return;
      }
      
      this.countdown.update(c => c - 1);
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
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
      this.finalizeStatus('Payment received.', 'success', 'Payment completed successfully.');
      return;
    }

    if (event.status === 'FAILED') {
      this.status.set('failed');
      this.finalizeStatus('Payment failed.', 'danger', 'The payment did not go through.');
      return;
    }

    if (event.status === 'EXPIRED') {
      this.status.set('expired');
      this.finalizeStatus('QR payment expired.', 'warning', 'The QR code expired before payment was completed.');
      return;
    }
  }

  private finalizeStatus(
    message: string,
    toastType: 'success' | 'danger' | 'warning',
    detailMessage: string
  ): void {
    this.terminalHandled = true;
    this.stopCountdown();
    this.transactionService.clearPendingTransaction(this.trxId);
    this.stopStatusStream();
    this.toast.show(message, toastType);
    this.redirectTimer = setTimeout(() => {
      const amount = this.transaction()?.total ?? 0;
      const createdAt = this.transaction()?.created_at ?? new Date().toISOString();
      void this.router.navigate(['/merchant/transactions', this.trxId, 'status'], {
        state: {
          status: this.status(),
          trxId: this.trxId,
          message,
          detailMessage,
          amount,
          date: createdAt
        }
      });
    }, 1500);
  }

  private stopStatusStream(): void {
    this.sseSub?.unsubscribe();
    this.sseSub = undefined;
  }
}
