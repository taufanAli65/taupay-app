import { Component, inject, OnInit, signal, Input } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
export class ProductFormComponent implements OnInit {
  @Input() id?: string;
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  isEdit = false;
  loading = signal(false);
  categories = signal<ProductCategory[]>([]);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  form = this.fb.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoryId: [''],
    description: ['']
  });

  isInvalid(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && c.touched);
  }

  ngOnInit(): void {
    this.productService.getCategories().subscribe(r => this.categories.set(r.data));
    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId) {
      this.isEdit = true;
      this.productService.getById(paramId).subscribe(r => {
        const p = r.data;
        this.form.patchValue({
          name: p.name, price: p.price,
          stock: p.stock, description: p.description,
          categoryId: p.category?.id
        });
        if (p.imageUrl) this.previewUrl.set(p.imageUrl);
      });
    }
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = e => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const v = this.form.value;
    const data = { name: v.name!, price: v.price!, stock: v.stock!, description: v.description ?? undefined, categoryId: v.categoryId || undefined };
    const paramId = this.route.snapshot.paramMap.get('id');
    const call = paramId
      ? this.productService.update(paramId, data, this.selectedFile() ?? undefined)
      : this.productService.create(data, this.selectedFile() ?? undefined);

    call.subscribe({
      next: () => {
        this.toast.show(this.isEdit ? 'Product updated!' : 'Product created!', 'success');
        this.router.navigate(['/merchant/products']);
      },
      error: () => this.loading.set(false)
    });
  }

  cancel(): void { this.router.navigate(['/merchant/products']); }
}
