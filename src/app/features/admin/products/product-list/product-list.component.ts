import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminProductService } from '@features/admin/services/admin-product.service';
import { Product } from '@shared/models/product.model';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { ToastService } from '@shared/components/toast/toast.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-admin-product-list',
  standalone: true,
  imports: [CommonModule, CurrencyIdrPipe, PaginationComponent, IconComponent],
  templateUrl: './product-list.component.html'
})
export class AdminProductListComponent implements OnInit {
  private productService = inject(AdminProductService);
  private toast = inject(ToastService);
  products = signal<Product[]>([]);
  currentPage = signal(0);
  totalPages = signal(1);

  ngOnInit(): void { this.loadPage(0); }

  loadPage(page: number): void {
    this.productService.getAll(page, 10).subscribe(r => {
      this.products.set(r.data ?? []);
      this.currentPage.set(r.pagination?.page ?? page);
    });
  }

  toggle(p: Product, activate: boolean): void {
    const call = activate ? this.productService.activate(p.id) : this.productService.deactivate(p.id);
    call.subscribe(() => {
      this.toast.show(`Product ${activate ? 'activated' : 'deactivated'}!`, 'success');
      this.loadPage(this.currentPage());
    });
  }
}
