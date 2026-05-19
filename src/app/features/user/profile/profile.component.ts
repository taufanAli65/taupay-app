import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserProfileStore } from '@features/user/state/user-profile.store';
import { ToastService } from '@shared/components/toast/toast.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile.component.html'
})
export class UserProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileStore = inject(UserProfileStore);
  private toast = inject(ToastService);
  saving = this.profileStore.saving;

  form = this.fb.group({
    firstName: [''],
    lastName: [''],
    address: [''],
    birthDate: [''],
    pin: ['', Validators.pattern(/^\d{6}$/)]
  });

  ngOnInit(): void {
    this.profileStore.loadProfile().subscribe(res => {
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
    this.profileStore.updateProfile(payload as any).subscribe({
      next: () => { this.toast.show('Profile updated!', 'success'); },
      error: () => { }
    });
  }
}
