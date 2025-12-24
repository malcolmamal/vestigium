import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { Message } from '@stomp/stompjs';

import type { JobResponse } from '../models';
import { VestigiumApiService } from '../services/vestigium-api.service';
import { WebSocketService } from '../services/websocket.service';

export interface JobsState {
  loading: boolean;
  error: string | null;
  items: JobResponse[];
}

@Injectable({ providedIn: 'root' })
export class JobsStore {
  private readonly api = inject(VestigiumApiService);
  private readonly ws = inject(WebSocketService);

  private readonly state = signal<JobsState>({
    loading: false,
    error: null,
    items: []
  });

  // Selectors
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly items = computed(() => this.state().items);

  constructor() {
    // Initial load of active jobs
    this.load();

    // Subscribe to WebSocket updates
    this.ws.watch('/topic/jobs').subscribe((message: Message) => {
      const job = JSON.parse(message.body) as JobResponse;
      this.handleJobUpdate(job);
    });
  }

  patchState(patch: Partial<JobsState>) {
    this.state.update(s => ({ ...s, ...patch }));
  }

  load() {
    this.patchState({ loading: true, error: null });

    // Initial fetch of pending/running/failed jobs to populate the list
    this.api
      .listJobs({
        status: ['PENDING', 'RUNNING', 'FAILED'],
        limit: 100
      })
      .pipe(finalize(() => this.patchState({ loading: false })))
      .subscribe({
        next: (items) => this.patchState({ items }),
        error: (e) => this.patchState({ error: e?.error?.detail ?? e?.message ?? 'Failed to load queue' })
      });
  }

  private handleJobUpdate(job: JobResponse) {
    this.patchState({
      items: this.updateJobList(this.state().items, job)
    });
  }

  private updateJobList(current: JobResponse[], job: JobResponse): JobResponse[] {
    const index = current.findIndex(j => j.id === job.id);
    if (index >= 0) {
      const next = [...current];
      next[index] = job;
      return next;
    } else {
      return [job, ...current];
    }
  }
}


