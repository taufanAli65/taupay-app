import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon.component.html',
  host: {
    class: 'inline-flex items-center justify-center'
  }
})
export class IconComponent {
  @Input() name = '';
  @Input() strokeWidth = 1.75;
}
