import { Injectable, computed, signal } from '@angular/core';

export type ToastType = 'success' | 'danger' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastStore {
  private nextId = 0;
  private state = signal<Toast[]>([]);

  toasts = computed(() => this.state());

  show(message: string, type: ToastType = 'info', duration = 4000): void {
    const id = ++this.nextId;
    this.state.update(toasts => [...toasts, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this.state.update(toasts => toasts.filter(toast => toast.id !== id));
  }
}