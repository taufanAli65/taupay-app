import { Injectable, inject } from '@angular/core';
import { ToastStore, ToastType } from '@core/state/toast.store';

export type { ToastType, Toast } from '@core/state/toast.store';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastStore = inject(ToastStore);

  toasts = this.toastStore.toasts;

  show(message: string, type: ToastType = 'info', duration = 4000): void {
    this.toastStore.show(message, type, duration);
  }

  dismiss(id: number): void {
    this.toastStore.dismiss(id);
  }
}
