import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { VestigiumApiService } from '../../services/vestigium-api.service';
import { JobsStore } from '../../store/jobs.store';
import type { JobResponse } from '../../models';

export interface FailedEntryGroup {
  entryId: string;
  jobs: JobResponse[];
}

@Component({
  selector: 'app-failed-jobs-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './failed-jobs.page.html',
  styleUrl: './failed-jobs.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FailedJobsPage {
  readonly jobs = inject(JobsStore);
  private readonly api = inject(VestigiumApiService);

  readonly failedGroups = computed(() => {
    const failed = this.jobs.items().filter((j) => j.status === 'FAILED');
    const groups: Map<string, JobResponse[]> = new Map();
    for (const j of failed) {
      if (!j.entryId) continue;
      if (!groups.has(j.entryId)) {
        groups.set(j.entryId, []);
      }
      groups.get(j.entryId)!.push(j);
    }
    return Array.from(groups.entries()).map(([entryId, jobs]) => ({
      entryId,
      jobs
    })) as FailedEntryGroup[];
  });

  readonly jobActionBusy = signal<string | null>(null);
  readonly jobActionError = signal<string | null>(null);

  constructor() {
    this.jobs.load();
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

  retryAll(group: FailedEntryGroup) {
    this.jobActionError.set(null);
    this.jobActionBusy.set('all-' + group.entryId);
    const obs = group.jobs.map((j) => this.api.retryJob(j.id!));
    import('rxjs')
      .then((m) => m.forkJoin(obs))
      .then((joined) => {
        joined
          .pipe(finalize(() => this.jobActionBusy.set(null)))
          .subscribe({
            next: () => {
              this.jobs.load();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            error: (e) =>
              this.jobActionError.set(e?.error?.detail ?? e?.message ?? 'Failed to retry some jobs')
          });
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

  deleteAll(group: FailedEntryGroup) {
    this.jobActionError.set(null);
    this.jobActionBusy.set('all-' + group.entryId);
    const obs = group.jobs.map((j) => this.api.deleteJob(j.id!));
    import('rxjs')
      .then((m) => m.forkJoin(obs))
      .then((joined) => {
        joined
          .pipe(finalize(() => this.jobActionBusy.set(null)))
          .subscribe({
            next: () => {
              this.jobs.load();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            error: (e) =>
              this.jobActionError.set(
                e?.error?.detail ?? e?.message ?? 'Failed to delete some jobs'
              )
          });
      });
  }
}

