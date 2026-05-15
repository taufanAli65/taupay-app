import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { MerchantCategory } from '@shared/models/merchant.model';
import { ApiResponse } from '@shared/models/api-response.model';
import { environment } from '@env';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-register-merchant',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, IconComponent],
  templateUrl: './register-merchant.component.html'
})
export class RegisterMerchantComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loading = signal(false);
  categories = signal<MerchantCategory[]>([]);

  form = this.fb.group({
    name: ['', Validators.required],
    categoryId: ['', Validators.required],
    address: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit(): void {
    this.http.get<ApiResponse<MerchantCategory[]>>(
      `${environment.apiUrl}/api/v1/merchant/category`
    ).subscribe(res => this.categories.set(res.data));
  }

  isInvalid(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && c.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const v = this.form.value;
    this.authService.registerMerchant({
      name: v.name!, categoryId: v.categoryId!,
      address: v.address!, email: v.email!, password: v.password!
    }).subscribe({
      next: () => {
        this.toast.show('Merchant account created! Please login.', 'success');
        this.router.navigate(['/auth/login']);
      },
      error: () => this.loading.set(false)
    });
  }
}
