import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MerchantService } from '../services/merchant.service';
import { MerchantProfile, MerchantCategory, UpdateMerchantRequest } from '@shared/models/merchant.model';
import { finalize, forkJoin } from 'rxjs';
import { ToastService } from '@shared/components/toast/toast.service';

interface MerchantProfileState {
  profile: MerchantProfile | null;
  categories: MerchantCategory[];
  loading: boolean;
  saving: boolean;
}

@Injectable({ providedIn: 'root' })
export class MerchantProfileStore {
  private merchantService = inject(MerchantService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  // --- STATE ---
  private state = signal<MerchantProfileState>({
    profile: null,
    categories: [],
    loading: false,
    saving: false
  });

  // --- SELECTORS ---
  profile = computed(() => this.state().profile);
  categories = computed(() => this.state().categories);
  loading = computed(() => this.state().loading);
  saving = computed(() => this.state().saving);

  // --- ACTIONS ---
  loadInitialData() {
    this.patchState({ loading: true });
    
    forkJoin({
      profile: this.merchantService.getMe(),
      categories: this.merchantService.getCategories()
    }).pipe(
      finalize(() => this.patchState({ loading: false })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.patchState({
          profile: res.profile.data,
          categories: res.categories.data ?? []
        });
      },
      error: () => {}
    });
  }

  updateProfile(data: UpdateMerchantRequest) {
    this.patchState({ saving: true });
    this.merchantService.updateMe(data)
      .pipe(
        finalize(() => this.patchState({ saving: false })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.toast.show('Profile updated successfully!', 'success');
          this.loadInitialData(); // Refresh to get updated data and balance
        },
        error: () => {
          this.toast.show('Failed to update profile', 'danger');
        }
      });
  }

  private patchState(partial: Partial<MerchantProfileState>) {
    this.state.update(s => ({ ...s, ...partial }));
  }
}
