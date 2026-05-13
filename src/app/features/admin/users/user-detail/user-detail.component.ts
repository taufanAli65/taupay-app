import { Component, inject, OnInit, signal, Input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminUserService } from '@features/admin/services/admin-user.service';
import { UserProfile } from '@shared/models/user.model';
import { ToastService } from '@shared/components/toast/toast.service';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, IconComponent],
  templateUrl: './user-detail.component.html'
})
export class AdminUserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(AdminUserService);
  private toast = inject(ToastService);
  user = signal<UserProfile | null>(null);

  initials(u: UserProfile): string {
    return ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase() || '?';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.userService.getById(id).subscribe(r => this.user.set(r.data));
  }

  toggle(activate: boolean): void {
    const u = this.user();
    if (!u) return;
    const call = activate ? this.userService.activate(u.id) : this.userService.deactivate(u.id);
    call.subscribe(() => {
      this.toast.show(`User ${activate ? 'activated' : 'deactivated'}!`, 'success');
      this.user.update(prev => prev ? { ...prev, isActive: activate } : prev);
    });
  }
}
