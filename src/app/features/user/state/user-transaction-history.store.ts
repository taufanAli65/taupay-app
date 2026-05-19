import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserTransactionService } from '../services/user-transaction.service';
import { TransactionHistoryItem } from '@shared/models/transaction.model';
import { finalize } from 'rxjs';

interface UserTransactionHistoryState {
  items: TransactionHistoryItem[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  startDate: string;
  endDate: string;
}

@Injectable({ providedIn: 'root' })
export class UserTransactionHistoryStore {
  private userTransactionService = inject(UserTransactionService);
  private destroyRef = inject(DestroyRef);

  // --- STATE ---
  private state = signal<UserTransactionHistoryState>({
    items: [],
    loading: false,
    currentPage: 0,
    totalPages: 1,
    totalElements: 0,
    startDate: '',
    endDate: ''
  });

  // --- SELECTORS ---
  items = computed(() => this.state().items);
  loading = computed(() => this.state().loading);
  currentPage = computed(() => this.state().currentPage);
  totalPages = computed(() => this.state().totalPages);
  totalElements = computed(() => this.state().totalElements);
  startDate = computed(() => this.state().startDate);
  endDate = computed(() => this.state().endDate);

  // --- ACTIONS ---
  loadPage(page: number) {
    this.patchState({ loading: true, currentPage: page });
    
    this.userTransactionService.getHistory(
      this.startDate() || undefined, 
      this.endDate() || undefined, 
      page, 
      10
    ).pipe(
      finalize(() => this.patchState({ loading: false })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: r => {
        this.patchState({
          items: r.data ?? [],
          currentPage: r.pagination?.page ?? page,
          totalPages: r.pagination?.totalPages ?? 1,
          totalElements: r.pagination?.totalElements ?? 0
        });
      },
      error: () => {
        this.patchState({
          items: [],
          currentPage: page,
          totalPages: 1,
          totalElements: 0
        });
      }
    });
  }

  setStartDate(date: string) {
    this.patchState({ startDate: date });
  }

  setEndDate(date: string) {
    this.patchState({ endDate: date });
  }

  applyFilters() {
    this.loadPage(0);
  }

  resetFilters() {
    this.patchState({ startDate: '', endDate: '' });
    this.loadPage(0);
  }

  private patchState(partial: Partial<UserTransactionHistoryState>) {
    this.state.update(s => ({ ...s, ...partial }));
  }
}
