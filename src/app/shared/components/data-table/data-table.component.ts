import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableColumn, TableFilter } from './data-table.model';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './data-table.component.html'
})
export class DataTableComponent {
  @Input({ required: true }) data: any[] = [];
  @Input({ required: true }) columns: TableColumn[] = [];
  @Input() loading = false;
  
  @Input() showSearch = true;
  @Input() searchPlaceholder = 'Search...';
  @Input() searchQuery = '';
  @Output() search = new EventEmitter<string>();

  @Input() filters: TableFilter[] = [];
  @Input() activeFilters: { [key: string]: any } = {};
  @Output() filterChange = new EventEmitter<{ [key: string]: any }>();

  @Input() currentPage = 0;
  @Input() totalPages = 1;
  @Input() totalElements = 0;
  @Output() pageChange = new EventEmitter<number>();

  @Input() customTemplates: { [key: string]: TemplateRef<any> } = {};

  private searchTimeout?: any;

  onSearchChange(query: string) {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.search.emit(query);
    }, 500);
  }

  onFilterChange(key: string, value: any) {
    const updatedFilters = { ...this.activeFilters, [key]: value };
    this.filterChange.emit(updatedFilters);
  }

  onPageChange(page: number) {
    this.pageChange.emit(page);
  }
}
