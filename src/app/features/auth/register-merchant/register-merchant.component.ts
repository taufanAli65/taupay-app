import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../state/auth.store';
import { ToastService } from '@shared/components/toast/toast.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-register-merchant',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, IconComponent],
  templateUrl: './register-merchant.component.html'
})
export class RegisterMerchantComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authStore = inject(AuthStore);
  private toast = inject(ToastService);
  private router = inject(Router);

  loading = this.authStore.loading;
  categories = this.authStore.categories;

  form = this.fb.group({
    name: ['', Validators.required],
    categoryId: ['', Validators.required],
    address: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit(): void {
    this.authStore.loadMerchantCategories().subscribe();
  }

  isInvalid(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && c.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    this.authStore.registerMerchant({
      name: v.name!, categoryId: v.categoryId!,
      address: v.address!, email: v.email!, password: v.password!
    }).subscribe({
      next: () => {
        this.toast.show('Merchant account created! Please login.', 'success');
        this.router.navigate(['/auth/login']);
      },
      error: () => { }
    });
  }
}
