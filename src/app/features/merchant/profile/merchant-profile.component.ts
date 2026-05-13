import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MerchantService } from '@features/merchant/services/merchant.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { MerchantProfile, MerchantCategory } from '@shared/models/merchant.model';

@Component({
  selector: 'app-merchant-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './merchant-profile.component.html'
})
export class MerchantProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private merchantService = inject(MerchantService);
  private toast = inject(ToastService);
  profile = signal<MerchantProfile | null>(null);
  categories = signal<MerchantCategory[]>([]);
  saving = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    categoryId: ['', Validators.required],
    address: ['', Validators.required]
  });

  ngOnInit(): void {
    this.merchantService.getCategories().subscribe(r => this.categories.set(r.data));
    this.merchantService.getMe().subscribe(r => {
      this.profile.set(r.data);
      this.form.patchValue({ name: r.data.name, categoryId: r.data.categoryId, address: r.data.address });
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.merchantService.updateMe(this.form.value as any).subscribe({
      next: () => { this.toast.show('Profile updated!', 'success'); this.saving.set(false); },
      error: () => this.saving.set(false)
    });
  }
}
