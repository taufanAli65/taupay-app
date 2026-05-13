import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '@features/merchant/services/product.service';
import { Product } from '@shared/models/product.model';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { ToastService } from '@shared/components/toast/toast.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [RouterLink, CommonModule, CurrencyIdrPipe, PaginationComponent, IconComponent],
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private toast = inject(ToastService);
  products = signal<Product[]>([]);
  loading = signal(false);
  currentPage = signal(0);
  totalPages = signal(1);

  ngOnInit(): void { this.loadPage(0); }

  loadPage(page: number): void {
    this.loading.set(true);
    this.productService.getAll(page, 10).subscribe({
      next: res => {
        this.products.set(res.data);
        this.currentPage.set(res.pagination?.page ?? 0);
        this.totalPages.set(Math.ceil((res.data.length < 10 ? page + 1 : page + 2)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleProduct(p: Product, activate: boolean): void {
    const call = activate ? this.productService.activate(p.id) : this.productService.deactivate(p.id);
    call.subscribe({
      next: () => {
        this.toast.show(`Product ${activate ? 'activated' : 'deactivated'}!`, 'success');
        this.loadPage(this.currentPage());
      }
    });
  }
}
