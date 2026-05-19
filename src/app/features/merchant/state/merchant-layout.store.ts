import { Injectable, computed, inject, signal } from '@angular/core';
import { MerchantService } from '../services/merchant.service';

@Injectable({ providedIn: 'root' })
export class MerchantLayoutStore {
  private merchantService = inject(MerchantService);

  private state = signal({ merchantName: 'Merchant' });

  merchantName = computed(() => this.state().merchantName);

  loadMerchantName(): void {
    this.merchantService.getMe().subscribe({
      next: res => this.patchState({ merchantName: res.data.name })
    });
  }

  private patchState(partial: Partial<{ merchantName: string }>) {
    this.state.update(state => ({ ...state, ...partial }));
  }
}