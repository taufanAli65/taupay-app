import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '@features/merchant/services/product.service';
import { TransactionService } from '@features/merchant/services/transaction.service';
import { Product } from '@shared/models/product.model';
import { CartItem } from '@shared/models/transaction.model';
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
  private productService = inject(ProductService);
  private transactionService = inject(TransactionService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  products = signal<Product[]>([]);
  cart = signal<CartItem[]>([]);
  loading = signal(false);
  search = '';

  get filteredProducts(): () => Product[] {
    return () => {
      const s = this.search.toLowerCase();
      return this.products().filter(p => p.name.toLowerCase().includes(s));
    };
  }

  get total(): number {
    return this.cart().reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  ngOnInit(): void {
    this.productService.getAll(0, 50).subscribe(r => this.products.set(r.data));
  }

  addToCart(p: Product): void {
    if (!p.isActive || p.stock === 0) return;
    this.cart.update(cart => {
      const existing = cart.find(i => i.productId === p.id);
      if (existing) {
        return cart.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...cart, { productId: p.id, name: p.name, price: p.price, quantity: 1, imageUrl: p.imageUrl }];
    });
  }

  updateQty(item: CartItem, qty: number): void {
    if (qty <= 0) { this.cart.update(c => c.filter(i => i.productId !== item.productId)); return; }
    this.cart.update(c => c.map(i => i.productId === item.productId ? { ...i, quantity: qty } : i));
  }

  clearCart(): void { this.cart.set([]); }

  submit(): void {
    if (this.cart().length === 0) return;
    this.loading.set(true);
    this.transactionService.create({
      products: this.cart().map(i => ({ product_id: i.productId, quantity: i.quantity }))
    }).subscribe({
      next: res => {
        this.toast.show('Transaction created!', 'success');

        if (isPlatformBrowser(this.platformId)) {
          this.transactionService.savePendingTransaction(res.data);
        }

        this.router.navigate(['/merchant/transactions', res.data.trx_id], { state: { transaction: res.data } });
      },
      error: () => this.loading.set(false)
    });
  }
}
