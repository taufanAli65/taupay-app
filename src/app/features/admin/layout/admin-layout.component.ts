import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { TokenStorageService } from '@core/services/token-storage.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private tokenService = inject(TokenStorageService);
  collapsed = signal(false);
  get email(): string { return this.tokenService.getEmail() ?? ''; }
  toggleSidebar(): void { this.collapsed.update(v => !v); }
  logout(): void { this.authService.logout(); }
}
