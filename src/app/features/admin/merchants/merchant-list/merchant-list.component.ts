import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminMerchantService } from '@features/admin/services/admin-merchant.service';
import { MerchantProfile } from '@shared/models/merchant.model';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { ToastService } from '@shared/components/toast/toast.service';

@Component({
  selector: 'app-admin-merchant-list',
  standalone: true,
  imports: [RouterLink, CommonModule, PaginationComponent],
  templateUrl: './merchant-list.component.html'
})
export class AdminMerchantListComponent implements OnInit {
  private merchantService = inject(AdminMerchantService);
  private toast = inject(ToastService);
  merchants = signal<MerchantProfile[]>([]);
  currentPage = signal(0);
  totalPages = signal(1);

  ngOnInit(): void { this.loadPage(0); }

  loadPage(page: number): void {
    this.merchantService.getAll(page, 10).subscribe(r => {
      this.merchants.set(r.data ?? []);
      this.currentPage.set(r.pagination?.page ?? page);
    });
  }

  toggle(m: MerchantProfile, activate: boolean): void {
    const call = activate ? this.merchantService.activate(m.id) : this.merchantService.deactivate(m.id);
    call.subscribe(() => {
      this.toast.show(`Merchant ${activate ? 'activated' : 'deactivated'}!`, 'success');
      this.loadPage(this.currentPage());
    });
  }
}
