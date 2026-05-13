import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, IconComponent],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  showPass = signal(false);
  loading = signal(false);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    address: ['', Validators.required],
    birthDate: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  isInvalid(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && c.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const v = this.form.value;
    this.authService.registerUser({
      firstName: v.firstName!, lastName: v.lastName ?? '',
      email: v.email!, address: v.address!,
      birthDate: v.birthDate!, password: v.password!
    }).subscribe({
      next: () => {
        this.toast.show('Account created! Please login.', 'success');
        this.router.navigate(['/auth/login']);
      },
      error: () => this.loading.set(false)
    });
  }
}
