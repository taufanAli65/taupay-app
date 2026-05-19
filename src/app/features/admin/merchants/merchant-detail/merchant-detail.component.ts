import { Component, inject, OnInit, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminMerchantService } from '@features/admin/services/admin-merchant.service';
import { AdminMerchantDetailStore } from '@features/admin/state/admin-merchant-detail.store';
import { ToastService } from '@shared/components/toast/toast.service';
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
  private merchantStore = inject(AdminMerchantDetailStore);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  isNew = true;
  isModalMode = false;
  isViewOnly = signal(false);
  saving = this.merchantStore.saving;
  categories = this.merchantStore.categories;

  products = this.merchantStore.products;
  loadingProducts = this.merchantStore.loadingProducts;
  currentPage = this.merchantStore.currentPage;
  totalPages = this.merchantStore.totalPages;
  totalElements = this.merchantStore.totalElements;

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
    this.merchantStore.loadCategories().subscribe();
    
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
    this.merchantStore.loadProducts(this.merchantId, page, 10).subscribe();
  }

  submit(): void {
    if (this.form.invalid || this.isViewOnly()) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    
    const call = this.merchantStore.saveMerchant(
      this.merchantId,
      this.isNew
        ? {
            name: v.name!,
            categoryId: v.categoryId!,
            address: v.address!,
            email: v.email!,
            password: v.password!
          }
        : {
            name: v.name!,
            categoryId: v.categoryId!,
            address: v.address!
          },
      this.isNew
    );

    call.subscribe({
      next: () => {
        this.toast.show(this.isNew ? 'Merchant created!' : 'Merchant updated!', 'success');
        this.onSaved.emit();
      },
      error: () => { }
    });
  }
}
