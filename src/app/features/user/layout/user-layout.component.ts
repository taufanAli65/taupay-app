import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { TokenStorageService } from '@core/services/token-storage.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './user-layout.component.html'
})
export class UserLayoutComponent {
  private authService = inject(AuthService);
  private tokenService = inject(TokenStorageService);
  // Desktop sidebar removed; using mobile bottom navigation

  get email(): string { return this.tokenService.getEmail() ?? ''; }
  get initials(): string {
    return this.email.substring(0, 2).toUpperCase();
  }

  logout(): void { this.authService.logout(); }
}
