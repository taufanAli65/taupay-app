import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { MerchantLayoutStore } from '@features/merchant/state/merchant-layout.store';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-merchant-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './merchant-layout.component.html'
})
export class MerchantLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private merchantLayoutStore = inject(MerchantLayoutStore);
  merchantName = this.merchantLayoutStore.merchantName;
  collapsed = signal(false);

  get initials(): string {
    return this.merchantName().substring(0, 2).toUpperCase();
  }

  ngOnInit(): void {
    this.merchantLayoutStore.loadMerchantName();
  }

  toggleSidebar(): void { this.collapsed.update(v => !v); }

  logout(): void { this.authService.logout(); }
}
