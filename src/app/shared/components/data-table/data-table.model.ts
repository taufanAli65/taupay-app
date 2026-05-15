import { TemplateRef } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  className?: string;
  custom?: boolean;
}

export interface TableFilter {
  key: string;
  label: string;
  type: 'select' | 'text';
  options?: { label: string; value: any }[];
}

export interface TableCellTemplateDirective {
  [key: string]: TemplateRef<any>;
}
