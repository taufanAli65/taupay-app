import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCategoryStore } from '../../state/product-category.store';
import { ProductCategory } from '@shared/models/product.model';
import { IconComponent } from '@shared/components/icon/icon.component';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { TableColumn } from '@shared/components/data-table/data-table.model';
import { ModalComponent } from '@shared/components/modal/modal.component';

@Component({
  selector: 'app-product-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, DataTableComponent, ModalComponent],
  templateUrl: './product-category-list.component.html'
})
export class ProductCategoryListComponent implements OnInit {
  readonly store = inject(ProductCategoryStore);

  isEditing = signal(false);
  editingId = signal<string | null>(null);
  categoryName = signal('');

  modalType = signal<'add' | 'edit' | 'delete' | null>(null);
  selectedCategory = signal<ProductCategory | null>(null);

  columns: TableColumn[] = [
    { key: 'name', label: 'Category Name', custom: true },
    { key: 'id', label: 'ID', className: 'font-mono text-[10px] opacity-50 uppercase' },
    { key: 'actions', label: 'Actions', className: 'text-right', custom: true }
  ];

  ngOnInit(): void {
    this.store.loadCategories();
  }

  onFormSubmit(): void {
    const name = this.categoryName().trim();
    if (!name) return;
    this.modalType.set(this.isEditing() ? 'edit' : 'add');
  }

  startEdit(cat: ProductCategory): void {
    this.isEditing.set(true);
    this.editingId.set(cat.id);
    this.categoryName.set(cat.name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.categoryName.set('');
  }

  triggerDelete(cat: ProductCategory): void {
    this.selectedCategory.set(cat);
    this.modalType.set('delete');
  }

  handleConfirm(): void {
    const type = this.modalType();
    const name = this.categoryName().trim();

    if (type === 'add') {
      this.store.createCategory(name);
      this.categoryName.set('');
    } else if (type === 'edit' && this.editingId()) {
      this.store.updateCategory(this.editingId()!, name);
      this.cancelEdit();
    } else if (type === 'delete' && this.selectedCategory()) {
      this.store.deleteCategory(this.selectedCategory()!.id);
    }

    this.closeModal();
  }

  closeModal(): void {
    this.modalType.set(null);
    this.selectedCategory.set(null);
  }
}
