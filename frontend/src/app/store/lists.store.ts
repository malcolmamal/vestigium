import { Injectable, inject, signal, computed } from '@angular/core';
import { finalize } from 'rxjs';

import type { ListResponse } from '../models';
import { VestigiumApiService } from '../services/vestigium-api.service';

export interface ListsState {
  loading: boolean;
  error: string | null;
  items: ListResponse[];
}

@Injectable({ providedIn: 'root' })
export class ListsStore {
  private readonly api = inject(VestigiumApiService);

  private readonly state = signal<ListsState>({
    loading: false,
    error: null,
    items: []
  });

  // Selectors
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly items = computed(() => this.state().items);

  patchState(patch: Partial<ListsState>) {
    this.state.update(s => ({ ...s, ...patch }));
  }

  load() {
    this.patchState({ loading: true, error: null });
    this.api
      .listLists()
      .pipe(finalize(() => this.patchState({ loading: false })))
      .subscribe({
        next: (items) => this.patchState({ items }),
        error: (e) => this.patchState({ error: e?.error?.detail ?? e?.message ?? 'Failed to load lists' })
      });
  }
}


