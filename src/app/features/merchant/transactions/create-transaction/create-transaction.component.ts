import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateTransactionStore } from '../../state/create-transaction.store';
import { TransactionService } from '@features/merchant/services/transaction.service';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import { ToastService } from '@shared/components/toast/toast.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-create-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyIdrPipe, IconComponent],
  templateUrl: './create-transaction.component.html'
})
export class CreateTransactionComponent implements OnInit {
  readonly store = inject(CreateTransactionStore);
  private transactionService = inject(TransactionService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  submitting = signal(false);

  ngOnInit(): void {
    this.store.loadProducts();
  }

  submitTransaction(): void {
    const cart = this.store.cart();
    if (cart.length === 0) return;

    this.submitting.set(true);
    
    this.transactionService.create({
      products: cart.map(i => ({ product_id: i.productId, quantity: i.quantity }))
    }).subscribe({
      next: res => {
        this.toast.show('Transaction created successfully!', 'success');
        this.store.clearCart();

        if (isPlatformBrowser(this.platformId)) {
          this.transactionService.savePendingTransaction(res.data);
        }

        this.router.navigate(['/merchant/transactions', res.data.trx_id]);
        this.submitting.set(false);
      },
      error: () => this.submitting.set(false)
    });
  }
}
