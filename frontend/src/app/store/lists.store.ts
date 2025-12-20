import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import type { ListResponse } from '../models/list.model';
import { VestigiumApiService } from '../services/vestigium-api.service';

@Injectable({ providedIn: 'root' })
export class ListsStore {
  private readonly api = inject(VestigiumApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<ListResponse[]>([]);

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listLists()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.items.set(items),
        error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to load lists')
      });
  }
}


