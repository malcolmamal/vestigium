import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { JobResponse } from '../../models/job.model';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { JobsStore } from '../../store/jobs.store';

@Component({
  selector: 'app-queue-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="pageHeader">
        <div>
          <h1>Queue</h1>
          <p class="muted">Pending, running and failed background jobs.</p>
        </div>
        <button class="button" type="button" (click)="jobs.load()">Refresh</button>
      </header>

      @if (jobActionError()) {
        <div class="errorBox">{{ jobActionError() }}</div>
      }

      @if (jobs.error()) {
        <div class="errorBox">{{ jobs.error() }}</div>
      } @else if (jobs.loading() && jobs.items().length === 0) {
        <div class="muted">Loading…</div>
      } @else if (jobs.items().length === 0) {
        <div class="muted">No queued jobs.</div>
      } @else {
        <div class="queueList">
          @for (j of jobs.items(); track j.id) {
            <div class="jobRow" [class.running]="isRunning(j)">
              <div class="jobMain">
                <div class="jobTop">
                  <span class="jobType">{{ j.type }}</span>
                  <span class="jobStatus">{{ j.status }}</span>
                  <a class="jobEntry" [routerLink]="['/entries', j.entryId]">{{ j.entryId }}</a>
                  <span class="jobMeta">attempt {{ j.attempts }}</span>
                </div>
                @if (j.lastError) {
                  <div class="jobErr">{{ j.lastError }}</div>
                }
              </div>

              <div class="jobActions">
                @if (j.status === 'PENDING') {
                  <button
                    class="button small"
                    type="button"
                    (click)="cancelJob(j)"
                    [disabled]="jobActionBusy() === j.id"
                  >
                    Cancel
                  </button>
                }
                <button
                  class="button small secondary"
                  type="button"
                  (click)="deleteJob(j)"
                  [disabled]="jobActionBusy() === j.id || isRunning(j)"
                >
                  Remove
                </button>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px;
    }
    .pageHeader {
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    h1 {
      margin: 0;
      font-size: 24px;
      letter-spacing: -0.02em;
    }
    .muted {
      color: rgba(255, 255, 255, 0.7);
      margin: 6px 0 0 0;
    }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 14px;
      border-radius: 10px;
      color: white;
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.18);
      cursor: pointer;
    }
    .button.secondary {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.14);
    }
    .button.small {
      padding: 8px 10px;
      border-radius: 10px;
    }
    .button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .errorBox {
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(255, 80, 80, 0.14);
      border: 1px solid rgba(255, 80, 80, 0.25);
      color: rgba(255, 220, 220, 0.92);
      margin-bottom: 12px;
    }
    .queueList {
      display: grid;
      gap: 10px;
    }
    .jobRow {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.10);
    }
    .jobRow.running {
      border-color: rgba(90, 97, 255, 0.30);
      background: rgba(90, 97, 255, 0.08);
    }
    .jobTop {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
      min-width: 0;
    }
    .jobType {
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .jobStatus {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.85);
    }
    .jobEntry {
      color: rgba(255, 255, 255, 0.92);
      text-decoration: none;
      max-width: 650px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .jobMeta {
      color: rgba(255, 255, 255, 0.65);
      font-size: 12px;
    }
    .jobErr {
      margin-top: 6px;
      color: rgba(255, 200, 200, 0.9);
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .jobActions {
      display: flex;
      gap: 8px;
      align-items: start;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueuePage {
  readonly jobs = inject(JobsStore);
  private readonly api = inject(VestigiumApiService);

  readonly jobActionBusy = signal<string | null>(null);
  readonly jobActionError = signal<string | null>(null);

  constructor() {
    effect(
      (onCleanup) => {
        this.jobs.load();
        const id = setInterval(() => this.jobs.load(), 2000);
        onCleanup(() => clearInterval(id));
      },
      { allowSignalWrites: true }
    );
  }

  isRunning(job: JobResponse) {
    return job.status === 'RUNNING';
  }

  cancelJob(job: JobResponse) {
    this.jobActionError.set(null);
    this.jobActionBusy.set(job.id);
    this.api
      .cancelJob(job.id)
      .pipe(finalize(() => this.jobActionBusy.set(null)))
      .subscribe({
        next: () => this.jobs.load(),
        error: (e) => this.jobActionError.set(e?.error?.detail ?? e?.message ?? 'Failed to cancel job')
      });
  }

  deleteJob(job: JobResponse) {
    this.jobActionError.set(null);
    this.jobActionBusy.set(job.id);
    this.api
      .deleteJob(job.id)
      .pipe(finalize(() => this.jobActionBusy.set(null)))
      .subscribe({
        next: () => this.jobs.load(),
        error: (e) => this.jobActionError.set(e?.error?.detail ?? e?.message ?? 'Failed to delete job')
      });
  }
}


