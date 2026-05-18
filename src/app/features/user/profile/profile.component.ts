import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '@features/user/services/user.service';
import { ToastService } from '@shared/components/toast/toast.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile.component.html'
})
export class UserProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  saving = signal(false);

  form = this.fb.group({
    firstName: [''],
    lastName: [''],
    address: [''],
    birthDate: [''],
    pin: ['', Validators.pattern(/^\d{6}$/)]
  });

  ngOnInit(): void {
    this.userService.getMe().subscribe(res => {
      const p = res.data;
      this.form.patchValue({
        firstName: p.firstName,
        lastName: p.lastName,
        address: p.address,
        birthDate: p.birthDate
      });
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload = {
      ...raw,
      pin: raw.pin?.trim() ? raw.pin : undefined
    };
    this.saving.set(true);
    this.userService.updateMe(payload as any).subscribe({
      next: () => { this.toast.show('Profile updated!', 'success'); this.saving.set(false); },
      error: () => this.saving.set(false)
    });
  }
}
