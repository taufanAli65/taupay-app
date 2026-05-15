import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MerchantService } from '@features/merchant/services/merchant.service';
import { ProductService } from '@features/merchant/services/product.service';
import { MerchantProfile } from '@shared/models/merchant.model';
import { Product } from '@shared/models/product.model';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-merchant-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, CurrencyIdrPipe, IconComponent],
  templateUrl: './dashboard.component.html'
})
export class MerchantDashboardComponent implements OnInit {
  private merchantService = inject(MerchantService);
  private productService = inject(ProductService);
  merchant = signal<MerchantProfile | null>(null);
  products = signal<Product[]>([]);

  get activeProducts(): number {
    return this.products().filter(p => p.isActive).length;
  }

  ngOnInit(): void {
    this.merchantService.getMe().subscribe(r => this.merchant.set(r.data));
    this.productService.getAll(0, 10).subscribe(r => this.products.set(r.data));
  }
}
