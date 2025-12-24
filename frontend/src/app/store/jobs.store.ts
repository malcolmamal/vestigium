import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { Message } from '@stomp/stompjs';

import type { JobResponse } from '../models';
import { VestigiumApiService } from '../services/vestigium-api.service';
import { WebSocketService } from '../services/websocket.service';

@Injectable({ providedIn: 'root' })
export class JobsStore {
  private readonly api = inject(VestigiumApiService);
  private readonly ws = inject(WebSocketService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<JobResponse[]>([]);

  constructor() {
    // Initial load of active jobs
    this.load();

    // Subscribe to WebSocket updates
    this.ws.watch('/topic/jobs').subscribe((message: Message) => {
      const job = JSON.parse(message.body) as JobResponse;
      this.handleJobUpdate(job);
    });
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    // Initial fetch of pending/running/failed jobs to populate the list
    this.api
      .listJobs({
        status: ['PENDING', 'RUNNING', 'FAILED'],
        limit: 100
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.items.set(items),
        error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to load queue')
      });
  }

  private handleJobUpdate(job: JobResponse) {
    this.items.update(current => {
      const index = current.findIndex(j => j.id === job.id);
      if (index >= 0) {
        // Update existing job
        const next = [...current];
        next[index] = job;
        return next;
      } else {
        // Add new job to the top (or bottom depending on sort, but usually top for new)
        // Assuming we want to see new jobs
        return [job, ...current];
      }
    });
  }
}


