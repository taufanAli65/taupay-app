import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '@shared/components/icon/icon.component';

type TransactionStatus = 'waiting' | 'paid' | 'failed' | 'expired';

@Component({
  selector: 'app-transaction-status',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './transaction-status.component.html'
})
export class TransactionStatusComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Core transaction data
  trxId = signal('');
  status = signal<TransactionStatus>('waiting');
  message = signal('');
  detailMessage = signal('');
  amount = signal<number>(0);
  date = signal<Date>(new Date());

  ngOnInit(): void {
    const route = this.route.snapshot;
    const state = history.state as Partial<{
      trxId: string;
      status: TransactionStatus;
      message: string;
      detailMessage: string;
      amount: number;
      date: string | Date;
    }>;

    this.trxId.set(state.trxId ?? route.paramMap.get('trxId') ?? '');
    this.status.set(state.status ?? 'waiting');
    this.message.set(state.message ?? 'Waiting for customer payment');
    this.detailMessage.set(state.detailMessage ?? 'Please ask the customer to scan the QRIS code.');
    
    this.amount.set(state.amount ?? 0);
    this.date.set(state.date ? new Date(state.date) : new Date());

    if (!this.trxId()) {
      void this.router.navigate(['/merchant/transactions/history']);
    }
  }

  get statusLabel(): string {
    return {
      waiting: 'Awaiting Payment',
      paid: 'Payment Successful',
      failed: 'Payment Failed',
      expired: 'Payment Expired'
    }[this.status()];
  }


  get statusBgClass(): string {
    return {
      waiting: 'bg-gradient-to-b from-yellow-50 to-white',
      paid: 'bg-gradient-to-b from-green-50 to-white',
      failed: 'bg-gradient-to-b from-red-50 to-white',
      expired: 'bg-gradient-to-b from-orange-50 to-white'
    }[this.status()];
  }

  get statusBorderClass(): string {
    return {
      waiting: 'border-2 border-yellow-500',
      paid: 'border-2 border-green-500',
      failed: 'border-2 border-red-500',
      expired: 'border-2 border-orange-500'
    }[this.status()];
  }

  get statusTextClass(): string {
    return {
      waiting: 'text-yellow-600',
      paid: 'text-green-600',
      failed: 'text-red-600',
      expired: 'text-orange-600'
    }[this.status()];
  }

  get iconName(): string {
    return {
      waiting: 'clock',
      paid: 'check-circle',
      failed: 'x-circle',
      expired: 'alert-circle'
    }[this.status()];
  }
}