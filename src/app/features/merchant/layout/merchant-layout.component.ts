import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { MerchantService } from '@features/merchant/services/merchant.service';
import { TokenStorageService } from '@core/services/token-storage.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-merchant-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './merchant-layout.component.html'
})
export class MerchantLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private merchantService = inject(MerchantService);
  private tokenService = inject(TokenStorageService);
  merchantName = signal('Merchant');
  collapsed = signal(false);

  get initials(): string {
    return this.merchantName().substring(0, 2).toUpperCase();
  }

  ngOnInit(): void {
    this.merchantService.getMe().subscribe(res => this.merchantName.set(res.data.name));
  }

  toggleSidebar(): void { this.collapsed.update(v => !v); }

  logout(): void { this.authService.logout(); }
}
