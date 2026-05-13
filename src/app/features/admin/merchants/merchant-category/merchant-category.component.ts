import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMerchantService } from '@features/admin/services/admin-merchant.service';
import { MerchantCategory } from '@shared/models/merchant.model';
import { ToastService } from '@shared/components/toast/toast.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-merchant-category',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './merchant-category.component.html'
})
export class MerchantCategoryComponent implements OnInit {
  private merchantService = inject(AdminMerchantService);
  private toast = inject(ToastService);
  categories = signal<MerchantCategory[]>([]);
  creating = signal(false);
  editingId = signal<string | null>(null);
  newName = '';
  editName = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    // Load from public endpoint
  }

  createCategory(): void {
    if (!this.newName.trim()) return;
    this.creating.set(true);
    this.merchantService.createCategory(this.newName.trim()).subscribe({
      next: r => {
        this.categories.update(c => [...c, r.data]);
        this.newName = '';
        this.toast.show('Category created!', 'success');
        this.creating.set(false);
      },
      error: () => this.creating.set(false)
    });
  }

  startEdit(cat: MerchantCategory): void {
    this.editingId.set(cat.id);
    this.editName = cat.name;
  }

  saveEdit(id: string): void {
    this.merchantService.updateCategory(id, this.editName).subscribe(() => {
      this.categories.update(c => c.map(x => x.id === id ? { ...x, name: this.editName } : x));
      this.editingId.set(null);
      this.toast.show('Category updated!', 'success');
    });
  }

  deleteCategory(id: string): void {
    if (!confirm('Delete this category?')) return;
    this.merchantService.deleteCategory(id).subscribe(() => {
      this.categories.update(c => c.filter(x => x.id !== id));
      this.toast.show('Category deleted!', 'success');
    });
  }
}
