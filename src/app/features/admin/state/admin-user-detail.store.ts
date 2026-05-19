import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { AdminUserService } from '../services/admin-user.service';
import { UserProfile } from '@shared/models/user.model';

interface AdminUserDetailState {
  user: UserProfile | null;
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminUserDetailStore {
  private userService = inject(AdminUserService);

  private state = signal<AdminUserDetailState>({
    user: null,
    loading: false
  });

  user = computed(() => this.state().user);
  loading = computed(() => this.state().loading);

  loadUser(id: string) {
    this.patchState({ loading: true });
    return this.userService.getById(id).pipe(
      tap(res => this.patchState({ user: res.data })),
      finalize(() => this.patchState({ loading: false }))
    );
  }

  setUser(user: UserProfile | null): void {
    this.patchState({ user });
  }

  private patchState(partial: Partial<AdminUserDetailState>) {
    this.state.update(state => ({ ...state, ...partial }));
  }
}