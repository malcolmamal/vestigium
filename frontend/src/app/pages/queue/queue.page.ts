import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { JobResponse } from '../../models';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { JobsStore } from '../../store/jobs.store';

@Component({
  selector: 'app-queue-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './queue.page.html',
  styleUrl: './queue.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueuePage {
  readonly jobs = inject(JobsStore);
  private readonly api = inject(VestigiumApiService);

  readonly jobActionBusy = signal<string | null>(null);
  readonly jobActionError = signal<string | null>(null);

  constructor() {
    this.jobs.load();
  }

  isRunning(job: JobResponse) {
    return job.status === 'RUNNING';
  }

  retryJob(job: JobResponse) {
    this.jobActionError.set(null);
    this.jobActionBusy.set(job.id!);
    this.api
      .retryJob(job.id!)
      .pipe(finalize(() => this.jobActionBusy.set(null)))
      .subscribe({
        next: () => {
          this.jobs.load();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (e) =>
          this.jobActionError.set(e?.error?.detail ?? e?.message ?? 'Failed to retry job')
      });
  }

  cancelJob(job: JobResponse) {
    this.jobActionError.set(null);
    this.jobActionBusy.set(job.id!);
    this.api
      .cancelJob(job.id!)
      .pipe(finalize(() => this.jobActionBusy.set(null)))
      .subscribe({
        next: () => {
          this.jobs.load();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (e) =>
          this.jobActionError.set(e?.error?.detail ?? e?.message ?? 'Failed to cancel job')
      });
  }

  deleteJob(job: JobResponse) {
    this.jobActionError.set(null);
    this.jobActionBusy.set(job.id!);
    this.api
      .deleteJob(job.id!)
      .pipe(finalize(() => this.jobActionBusy.set(null)))
      .subscribe({
        next: () => {
          this.jobs.load();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (e) =>
          this.jobActionError.set(e?.error?.detail ?? e?.message ?? 'Failed to delete job')
      });
  }
}
