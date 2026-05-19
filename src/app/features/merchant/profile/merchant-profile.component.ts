import { Component, inject, OnInit, effect } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MerchantProfileStore } from '../state/merchant-profile.store';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import { IconComponent } from '@shared/components/icon/icon.component';
import { UpdateMerchantRequest } from '@shared/models/merchant.model';

@Component({
  selector: 'app-merchant-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, CurrencyIdrPipe, IconComponent],
  templateUrl: './merchant-profile.component.html'
})
export class MerchantProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  readonly store = inject(MerchantProfileStore);

  form = this.fb.group({
    name: ['', Validators.required],
    categoryId: ['', Validators.required],
    address: ['', Validators.required],
    pin: ['', [Validators.pattern(/^\d{6}$/)]]
  });

  constructor() {
    // Re-patch form when profile is loaded
    effect(() => {
      const p = this.store.profile();
      if (p) {
        this.form.patchValue({
          name: p.name,
          categoryId: p.categoryId,
          address: p.address
        }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.store.loadInitialData();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: UpdateMerchantRequest = {
      name: raw.name ?? '',
      categoryId: raw.categoryId ?? '',
      address: raw.address ?? '',
      pin: raw.pin && raw.pin.trim() ? raw.pin.trim() : undefined
    };

    this.store.updateProfile(payload);
  }
}
