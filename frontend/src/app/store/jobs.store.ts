import { Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';

import type { JobResponse } from '../models/job.model';
import { VestigiumApiService } from '../services/vestigium-api.service';
import { inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class JobsStore {
  private readonly api = inject(VestigiumApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<JobResponse[]>([]);

  private pollInterval: any = null;

  startPolling(ms = 3000) {
    if (this.pollInterval) return;
    this.load();
    this.pollInterval = setInterval(() => this.load(), ms);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  load(params?: { entryId?: string; status?: string[]; limit?: number }) {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .listJobs({
        entryId: params?.entryId,
        status: params?.status ?? ['PENDING', 'RUNNING', 'FAILED'],
        limit: params?.limit ?? 50
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.items.set(items),
        error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to load queue')
      });
  }
}


