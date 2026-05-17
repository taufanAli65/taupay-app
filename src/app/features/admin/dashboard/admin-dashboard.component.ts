import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminDashboardStore } from '../state/admin-dashboard.store';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, IconComponent],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  readonly store = inject(AdminDashboardStore);

  ngOnInit(): void {
    this.store.loadDashboardData();
  }
}
