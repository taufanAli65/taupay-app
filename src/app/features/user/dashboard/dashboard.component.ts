import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '@features/user/services/user.service';
import { UserProfile } from '@shared/models/user.model';
import { IconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './dashboard.component.html'
})
export class UserDashboardComponent implements OnInit {
  private userService = inject(UserService);
  profile = signal<UserProfile | null>(null);

  get initials(): string {
    const p = this.profile();
    if (!p) return '?';
    return ((p.firstName?.[0] ?? '') + (p.lastName?.[0] ?? '')).toUpperCase();
  }

  ngOnInit(): void {
    this.userService.getMe().subscribe(res => this.profile.set(res.data));
  }
}
