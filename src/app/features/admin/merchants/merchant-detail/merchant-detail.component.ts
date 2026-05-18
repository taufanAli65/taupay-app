import { Component, inject, OnInit, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminMerchantService } from '@features/admin/services/admin-merchant.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { MerchantCategory } from '@shared/models/merchant.model';
import { Product } from '@shared/models/product.model';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { TableColumn } from '@shared/components/data-table/data-table.model';
import { CurrencyIdrPipe } from '@shared/pipes/currency-idr.pipe';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-admin-merchant-detail',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, DataTableComponent, CurrencyIdrPipe, IconComponent, RouterLink],
  templateUrl: './merchant-detail.component.html'
})
export class AdminMerchantDetailComponent implements OnInit, OnChanges {
  @Input() merchantId?: string | null;
  @Output() onSaved = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private merchantService = inject(AdminMerchantService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  isNew = true;
  isModalMode = false;
  isViewOnly = signal(false);
  saving = signal(false);
  categories = signal<MerchantCategory[]>([]);

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
    
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId) {
      this.isModalMode = false;
      this.merchantId = routeId;
      this.resetAndInit(routeId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['merchantId']) {
      this.isModalMode = true;
      const id = changes['merchantId'].currentValue;
      this.resetAndInit(id);
    }
  }

  private resetAndInit(id?: string | null) {
    this.form.reset();
    this.isNew = !id || id === 'new';
    
    this.isViewOnly.set(!this.isNew && !this.isModalMode);

    const emailControl = this.form.get('email');
    const passwordControl = this.form.get('password');
    
    if (this.isNew) {
      emailControl?.setValidators([Validators.required, Validators.email]);
      passwordControl?.setValidators([Validators.required, Validators.minLength(8)]);
    } else {
      emailControl?.clearValidators();
      passwordControl?.clearValidators();
      this.loadMerchant(id!);
      this.loadProducts(0);
    }
    emailControl?.updateValueAndValidity();
    passwordControl?.updateValueAndValidity();

    if (this.isViewOnly()) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }

  private loadMerchant(id: string) {
    this.merchantService.getById(id).subscribe(r => {
      this.form.patchValue({ 
        name: r.data.name, 
        categoryId: r.data.categoryId, 
        address: r.data.address 
      });
    });
  }

  loadProducts(page: number): void {
    if (this.isNew || !this.merchantId) return;
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

  submit(): void {
    if (this.form.invalid || this.isViewOnly()) {
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
      : this.merchantService.update(this.merchantId!, {
          name: v.name!,
          categoryId: v.categoryId!,
          address: v.address!
        });

    call.subscribe({
      next: () => {
        this.toast.show(this.isNew ? 'Merchant created!' : 'Merchant updated!', 'success');
        this.onSaved.emit();
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }
}
