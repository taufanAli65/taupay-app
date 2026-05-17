import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-form-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" (click)="onBackdropClick($event)">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-cream-dark flex items-center justify-between bg-white sticky top-0 z-10">
          <h3 class="text-xl font-bold text-black tracking-tight">{{ title }}</h3>
          <button (click)="onClose.emit()" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream transition-colors text-gray-400 hover:text-black">
            <app-icon name="close" class="w-5 h-5"></app-icon>
          </button>
        </div>

        <!-- Body (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-6 bg-white">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-cream-dark flex justify-end gap-3 bg-cream/10">
          <button 
            (click)="onClose.emit()"
            class="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-black transition-colors rounded-lg border border-transparent hover:border-cream-dark">
            {{ cancelLabel }}
          </button>
          <button 
            (click)="onSave.emit()"
            [disabled]="disabled || isLoading"
            class="px-8 py-2.5 bg-emerald-dark hover:bg-black text-white text-sm font-bold rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            @if (isLoading) {
              <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing...
            } @else {
              {{ saveLabel }}
            }
          </button>
        </div>
      </div>
    </div>
  `
})
export class FormModalComponent {
  @Input() title = 'Form';
  @Input() saveLabel = 'Save Changes';
  @Input() cancelLabel = 'Cancel';
  @Input() isLoading = false;
  @Input() disabled = false;

  @Output() onSave = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent) {
    this.onClose.emit();
  }
}
