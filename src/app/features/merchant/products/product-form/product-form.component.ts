import { Component, inject, OnInit, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductService } from '@features/merchant/services/product.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { ProductCategory } from '@shared/models/product.model';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, IconComponent],
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit, OnChanges {
  @Input() productId?: string | null;
  @Output() onSaved = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private toast = inject(ToastService);

  isEdit = false;
  loading = signal(false);
  categories = signal<ProductCategory[]>([]);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  isImageRemoved = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    price: ['' as any, Validators.required],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoryId: [''],
    description: ['']
  });

  ngOnInit(): void {
    this.productService.getCategories().subscribe(r => this.categories.set(r.data));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId']) {
      this.resetForm();
      const id = changes['productId'].currentValue;
      if (id && id !== 'new') {
        this.isEdit = true;
        this.loadProduct(id);
      } else {
        this.isEdit = false;
      }
    }
  }

  private resetForm() {
    this.form.reset({ name: '', price: '', stock: 0, categoryId: '', description: '' });
    this.previewUrl.set(null);
    this.selectedFile.set(null);
    this.isImageRemoved.set(false);
  }

  private loadProduct(id: string) {
    this.loading.set(true);
    this.productService.getById(id).subscribe({
      next: r => {
        const p = r.data;
        this.form.patchValue({
          name: p.name, 
          price: this.formatNumber(p.price) as any,
          stock: p.stock, 
          description: p.description,
          categoryId: p.category?.id
        });
        if (p.imageUrl) this.previewUrl.set(p.imageUrl);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); 
    if (value) {
      const formatted = this.formatNumber(parseInt(value, 10));
      this.form.get('price')?.setValue(formatted as any, { emitEvent: false });
    } else {
      this.form.get('price')?.setValue('' as any, { emitEvent: false });
    }
  }

  private formatNumber(n: number): string {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  private parseNumber(s: string): number {
    return parseInt(s.toString().replace(/\./g, ''), 10) || 0;
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile.set(file);
    this.isImageRemoved.set(false);
    const reader = new FileReader();
    reader.onload = e => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.isImageRemoved.set(true);
  }

  isInvalid(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && c.touched);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const v = this.form.value;
    
    const data = { 
      name: v.name!, 
      price: this.parseNumber(v.price || '0'), 
      stock: v.stock!, 
      description: v.description ?? '', 
      categoryId: v.categoryId || '',
      isImageRemoved: this.isImageRemoved() 
    };

    const call = this.isEdit && this.productId
      ? this.productService.update(this.productId, data, this.selectedFile() ?? undefined)
      : this.productService.create(data, this.selectedFile() ?? undefined);

    call.subscribe({
      next: () => {
        this.toast.show(this.isEdit ? 'Product updated!' : 'Product created!', 'success');
        this.onSaved.emit();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
