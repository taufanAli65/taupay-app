import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { UserService } from '../services/user.service';
import { UpdateUserRequest, UserProfile } from '@shared/models/user.model';

interface UserProfileState {
  profile: UserProfile | null;
  loading: boolean;
  saving: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserProfileStore {
  private userService = inject(UserService);

  private state = signal<UserProfileState>({
    profile: null,
    loading: false,
    saving: false
  });

  profile = computed(() => this.state().profile);
  loading = computed(() => this.state().loading);
  saving = computed(() => this.state().saving);

  loadProfile() {
    this.patchState({ loading: true });
    return this.userService.getMe().pipe(
      tap(res => this.patchState({ profile: res.data })),
      finalize(() => this.patchState({ loading: false }))
    );
  }

  updateProfile(body: UpdateUserRequest) {
    this.patchState({ saving: true });
    return this.userService.updateMe(body).pipe(
      tap(() => {
        const current = this.state().profile;
        if (current) {
          this.patchState({
            profile: {
              ...current,
              firstName: body.firstName ?? current.firstName,
              lastName: body.lastName ?? current.lastName,
              address: body.address ?? current.address,
              birthDate: body.birthDate ?? current.birthDate
            }
          });
        }
      }),
      finalize(() => this.patchState({ saving: false }))
    );
  }

  private patchState(partial: Partial<UserProfileState>) {
    this.state.update(state => ({ ...state, ...partial }));
  }
}