import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminMerchantService } from '@features/admin/services/admin-merchant.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { MerchantCategory } from '@shared/models/merchant.model';
import { Product } from '@shared/models/product.model';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { TableColumn } from '@shared/components/data-table/data-table.model';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';

@Component({
  selector: 'app-admin-merchant-detail',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, DataTableComponent, CurrencyIdrPipe],
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

  products = signal<Product[]>([]);
  loadingProducts = signal(false);
  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);

  productColumns: TableColumn[] = [
    { key: 'imageUrl', label: 'Image', custom: true },
    { key: 'name', label: 'Product Name' },
    { key: 'price', label: 'Price', custom: true },
    { key: 'stock', label: 'Stock' },
    { key: 'isActive', label: 'Status', custom: true }
  ];

  form = this.fb.group({
    name: ['', Validators.required],
    categoryId: ['', Validators.required],
    address: ['', Validators.required],
    email: [''],
    password: ['']
  });

  ngOnInit(): void {
    this.merchantService.getCategories().subscribe(r => this.categories.set(r.data));

    const id = this.route.snapshot.paramMap.get('id');
    this.isNew = !id || id === 'new';
    if (!id || id === 'new') {
      this.isNew = true;
      this.form.get('email')?.addValidators([Validators.required, Validators.email]);
      this.form.get('password')?.addValidators([Validators.required, Validators.minLength(8)]);
    } else {
      this.isNew = false;
      this.merchantId = id;
      this.merchantService.getById(id).subscribe(r => {
        this.form.patchValue({ 
          name: r.data.name, 
          categoryId: r.data.categoryId, 
          address: r.data.address 
        });
      });
      this.loadProducts(0);
    }
  }

  loadProducts(page: number): void {
    if (this.isNew) return;
    this.loadingProducts.set(true);
    this.merchantService.getMerchantProducts(this.merchantId, page, 10).subscribe({
      next: r => {
        this.products.set(r.data ?? []);
        this.currentPage.set(r.pagination?.page ?? page);
        this.totalPages.set(r.pagination?.totalPages ?? 1);
        this.totalElements.set(r.pagination?.totalElements ?? 0);
        this.loadingProducts.set(false);
      },
      error: () => this.loadingProducts.set(false)
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const v = this.form.value;
    
    const call = this.isNew
      ? this.merchantService.create({
          name: v.name!,
          categoryId: v.categoryId!,
          address: v.address!,
          email: v.email!,
          password: v.password!
        })
      : this.merchantService.update(this.merchantId, {
          name: v.name!,
          categoryId: v.categoryId!,
          address: v.address!
        });

    call.subscribe({
      next: () => {
        this.toast.show(this.isNew ? 'Merchant created!' : 'Merchant updated!', 'success');
        this.router.navigate(['/admin/merchants']);
      },
      error: () => this.saving.set(false)
    });
  }
}
