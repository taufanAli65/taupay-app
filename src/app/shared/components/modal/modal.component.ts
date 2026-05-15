import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type ModalType = 'danger' | 'warning' | 'info' | 'success';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
        <div class="p-6 text-center">
          <div [ngClass]="{
            'bg-red-50 text-red-500': type === 'danger',
            'bg-yellow-50 text-yellow-500': type === 'warning',
            'bg-blue-50 text-blue-500': type === 'info',
            'bg-green-50 text-green-500': type === 'success'
          }" class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <app-icon [name]="iconName" class="w-8 h-8"></app-icon>
          </div>
          
          <h3 class="text-xl font-bold text-black mb-2">{{ title }}</h3>
          <p class="text-gray-500 text-sm leading-relaxed">
            <ng-content></ng-content>
          </p>
        </div>
        
        <div class="flex border-t border-gray-100">
          <button 
            (click)="onCancel.emit()"
            class="flex-1 px-4 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-100">
            {{ cancelLabel }}
          </button>
          <button 
            (click)="onConfirm.emit()"
            [ngClass]="{
              'text-red-600 hover:bg-red-50': type === 'danger',
              'text-yellow-600 hover:bg-yellow-50': type === 'warning',
              'text-blue-600 hover:bg-blue-50': type === 'info',
              'text-green-600 hover:bg-green-50': type === 'success'
            }"
            class="flex-1 px-4 py-4 text-sm font-bold transition-colors">
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() title = 'Confirmation';
  @Input() type: ModalType = 'info';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() icon = '';

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  get iconName(): string {
    if (this.icon) return this.icon;
    switch (this.type) {
      case 'danger': return 'trash';
      case 'warning': return 'alert-triangle';
      case 'success': return 'check-circle';
      default: return 'info';
    }
  }
}
