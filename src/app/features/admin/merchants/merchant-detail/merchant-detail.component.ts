import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminMerchantService } from '@features/admin/services/admin-merchant.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { MerchantCategory } from '@shared/models/merchant.model';

@Component({
  selector: 'app-admin-merchant-detail',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './merchant-detail.component.html'
})
export class AdminMerchantDetailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private merchantService = inject(AdminMerchantService);
  private toast = inject(ToastService);

  isNew = false;
  saving = signal(false);
  categories = signal<MerchantCategory[]>([]);
  merchantId = '';

  form = this.fb.group({
    name: ['', Validators.required],
    categoryId: ['', Validators.required],
    address: ['', Validators.required],
    email: [''],
    password: ['']
  });

  ngOnInit(): void {
    // Load categories from public endpoint
    const id = this.route.snapshot.paramMap.get('id');
    this.isNew = !id || id === 'new';
    if (!this.isNew) {
      this.merchantId = id!;
      this.merchantService.getById(id!).subscribe(r => {
        this.form.patchValue({ name: r.data.name, categoryId: r.data.categoryId, address: r.data.address });
      });
    }
    if (this.isNew) {
      this.form.get('email')?.addValidators([Validators.required, Validators.email]);
      this.form.get('password')?.addValidators([Validators.required, Validators.minLength(8)]);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const call = this.isNew
      ? this.merchantService.create({ name: v.name!, categoryId: v.categoryId!, address: v.address!, email: v.email!, password: v.password! })
      : this.merchantService.update(this.merchantId, { name: v.name!, categoryId: v.categoryId!, address: v.address! });

    call.subscribe({
      next: () => {
        this.toast.show(this.isNew ? 'Merchant created!' : 'Merchant updated!', 'success');
        this.router.navigate(['/admin/merchants']);
      },
      error: () => this.saving.set(false)
    });
  }
}
