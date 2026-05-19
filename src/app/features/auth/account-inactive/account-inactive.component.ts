import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconComponent } from '@shared/components/icon/icon.component';
import { normalizeStatusMessage } from '@shared/utils/normalize-status-message.util';

@Component({
  selector: 'app-account-inactive',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './account-inactive.component.html'
})
export class AccountInactiveComponent {
  private route = inject(ActivatedRoute);

  message = normalizeStatusMessage(
    this.route.snapshot.queryParamMap.get('message') || 'User account is inactive.'
  );
}