import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminUserService } from '@features/admin/services/admin-user.service';
import { AdminMerchantService } from '@features/admin/services/admin-merchant.service';
import { AdminProductService } from '@features/admin/services/admin-product.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private userService = inject(AdminUserService);
  private merchantService = inject(AdminMerchantService);
  private productService = inject(AdminProductService);

  userCount = signal(0);
  merchantCount = signal(0);
  productCount = signal(0);

  ngOnInit(): void {
    this.userService.getAll(0, 1).subscribe(r => this.userCount.set(r.data?.length ?? 0));
    this.merchantService.getAll(0, 1).subscribe(r => this.merchantCount.set(r.data?.length ?? 0));
    this.productService.getAll(0, 1).subscribe(r => this.productCount.set(r.data?.length ?? 0));
  }
}
