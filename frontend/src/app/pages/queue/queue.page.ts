import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { JobResponse } from '../../models';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { JobsStore } from '../../store/jobs.store';

interface RunningGroup {
  type: string;
  jobs: JobResponse[];
}

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

  readonly runningJobs = computed(() => this.jobs.items().filter((j) => j.status === 'RUNNING'));

  readonly runningGroups = computed<RunningGroup[]>(() => {
    const groups = new Map<string, JobResponse[]>();
    for (const job of this.runningJobs()) {
      const type = job.type ?? 'UNKNOWN';
      const list = groups.get(type) ?? [];
      list.push(job);
      groups.set(type, list);
    }
    return Array.from(groups.entries()).map(([type, jobs]) => ({ type, jobs }));
  });

  constructor() {
    this.jobs.load();
  }

  isRunning(job: JobResponse) {
    return job.status === 'RUNNING';
  }

  isLlmType(type: string) {
    return type === 'ENRICH_ENTRY';
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
