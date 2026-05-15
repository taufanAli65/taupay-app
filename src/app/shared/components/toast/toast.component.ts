import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './toast.component.html'
})
export class ToastComponent {
  toastService = inject(ToastService);

  iconName(type: string): string {
    return {
      success: 'check-circle',
      danger: 'x-circle',
      warning: 'warning',
      info: 'info'
    }[type] ?? 'info';
  }
}
