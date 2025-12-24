import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { TagChipsInputComponent } from '../../components/tag-chips-input/tag-chips-input.component';
import type { EntryDetailsResponse } from '../../models/entry.model';
import type { JobResponse } from '../../models/job.model';
import type { ListResponse } from '../../models/list.model';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';

@Component({
  selector: 'app-entry-details-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, TagChipsInputComponent],
  templateUrl: './entry-details.page.html',
  styleUrl: './entry-details.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntryDetailsPage {
  private readonly api = inject(VestigiumApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly entriesStore = inject(EntriesStore);

  readonly id = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionHint = signal<string | null>(null);
  readonly showThumbModal = signal(false);

  readonly data = signal<EntryDetailsResponse | null>(null);
  readonly tags = signal<string[]>([]);

  readonly jobsLoading = signal(false);
  readonly jobsError = signal<string | null>(null);
  readonly jobs = signal<JobResponse[]>([]);
  readonly jobActionBusy = signal<string | null>(null);
  readonly jobActionError = signal<string | null>(null);
  readonly jobsCollapsed = signal(true);

  readonly pendingAutoRefresh = signal<{ type: string; observed: boolean }[]>([]);

  readonly runningJobsCount = computed(() => this.jobs().filter((j) => j.status === 'RUNNING').length);
  readonly failedJobsCount = computed(() => this.jobs().filter((j) => j.status === 'FAILED').length);

  private tagsSaveTimer: any = null;
  private lastRunningCount = 0;
  private lastThumbJobCount = 0;

  readonly allLists = signal<ListResponse[]>([]);
  readonly selectedListIds = signal<string[]>([]);
  readonly listsError = signal<string | null>(null);
  private listsSaveTimer: any = null;

  readonly detailedCollapsed = signal(true);

  readonly form = new FormGroup({
    title: new FormControl<string>('', { nonNullable: true }),
    description: new FormControl<string>('', { nonNullable: true }),
    detailedDescription: new FormControl<string>('', { nonNullable: true })
  });

  readonly thumbVersion = signal(Date.now());
  
  readonly entry = computed(() => this.data()?.entry ?? null);
  readonly thumbnailUrl = computed(() => {
    const d = this.data();
    if (!d) return null;
    return `${d.entry.thumbnailUrl}?v=${this.thumbVersion()}`;
  });
  readonly thumbModalUrl = computed(() => {
    const d = this.data();
    if (!d) return null;
    const baseUrl = d.entry.thumbnailLargeUrl || d.entry.thumbnailUrl;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}v=${this.thumbVersion()}`;
  });

  constructor() {
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id');
      this.id.set(id);
      if (id) this.refresh(id);
    });

    effect((onCleanup) => {
      const id = this.id();
      if (!id) return;
      this.loadJobs(id);
      const t = setInterval(() => this.loadJobs(id), 1500);
      onCleanup(() => clearInterval(t));
    });

    effect(() => {
      // Collapsed by default; auto-expand while something is RUNNING; auto-collapse once nothing is running.
      this.jobsCollapsed.set(this.runningJobsCount() === 0);
    });
  }

  refresh(id: string) {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getEntry(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.data.set(res);
          this.form.controls.title.setValue(res.entry.title ?? '');
          this.form.controls.description.setValue(res.entry.description ?? '');
          this.form.controls.detailedDescription.setValue(res.entry.detailedDescription ?? '');
          this.tags.set(res.entry.tags ?? []);
          this.loadLists(id);
        },
        error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to load entry')
      });
  }

  save() {
    const id = this.id();
    if (!id) return;
    this.saving.set(true);
    this.error.set(null);

    this.api
      .patchEntry(id, {
        title: this.form.controls.title.value.trim() || null,
        description: this.form.controls.description.value.trim() || null,
        detailedDescription: this.form.controls.detailedDescription.value.trim() || null
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.refresh(id),
        error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to save')
      });
  }

  toggleImportant() {
    const id = this.id();
    const entry = this.entry();
    if (!id || !entry) return;
    this.api.patchEntry(id, { important: !entry.important }).subscribe({
      next: () => this.refresh(id),
      error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to update')
    });
  }

  markVisited() {
    const id = this.id();
    if (!id) return;
    this.api.markVisited(id).subscribe({
      next: () => this.refresh(id),
      error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to mark visited')
    });
  }

  enqueueEnrich() {
    const id = this.id();
    if (!id) return;
    this.actionHint.set('Enrichment queued. Refresh in a moment to see updates.');
    this.addPendingAutoRefresh('ENRICH_ENTRY');
    this.api.enqueueEnrich(id).subscribe({
      next: () => this.loadJobs(id),
      error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to enqueue enrichment')
    });
  }

  enqueueThumbnail() {
    const id = this.id();
    if (!id) return;
    this.actionHint.set('Thumbnail regeneration queued. Refresh in a moment.');
    this.addPendingAutoRefresh('REGENERATE_THUMBNAIL');
    this.api.enqueueThumbnail(id).subscribe({
      next: () => this.loadJobs(id),
      error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to enqueue thumbnail regeneration')
    });
  }

  onImgError(evt: Event) {
    (evt.target as HTMLImageElement).style.display = 'none';
  }

  openThumbModal() {
    this.showThumbModal.set(true);
  }

  closeThumbModal() {
    this.showThumbModal.set(false);
  }

  loadJobs(entryId: string) {
    this.jobsLoading.set(true);
    this.jobsError.set(null);
    this.api
      .listJobs({ entryId, limit: 50 })
      .pipe(finalize(() => this.jobsLoading.set(false)))
      .subscribe({
        next: (items) => {
          this.jobs.set(items);
          const running = items.filter((j) => j.status === 'RUNNING').length;

          // Track thumbnail job completion for cache-busting
          const thumbJobCount = items.filter((j) => 
            j.type === 'REGENERATE_THUMBNAIL' && (j.status === 'PENDING' || j.status === 'RUNNING')
          ).length;
          if (this.lastThumbJobCount > 0 && thumbJobCount === 0) {
            this.thumbVersion.set(Date.now());
          }
          this.lastThumbJobCount = thumbJobCount;

          // Mark pending types as "observed" once we see any job of that type.
          const pending = this.pendingAutoRefresh();
          if (pending.length > 0) {
            const nextPending = pending.map((p) => {
              if (p.observed) return p;
              const seen = items.some((j) => j.type === p.type);
              return seen ? { ...p, observed: true } : p;
            });
            this.pendingAutoRefresh.set(nextPending);

            // When an observed pending job type has no active jobs left, refresh entry once.
            const nowPending = this.pendingAutoRefresh();
            const completedTypes = nowPending
              .filter((p) => p.observed)
              .filter((p) => !items.some((j) => j.type === p.type && (j.status === 'PENDING' || j.status === 'RUNNING')))
              .map((p) => p.type);

            if (completedTypes.length > 0) {
              this.pendingAutoRefresh.set(nowPending.filter((p) => !completedTypes.includes(p.type)));
              const id = this.id();
              if (id) setTimeout(() => this.refresh(id), 900);
            }
          }

          // Auto-refresh the entry after work finishes (give backend a moment to persist thumbnail/files).
          if (this.lastRunningCount > 0 && running === 0) {
            const id = this.id();
            if (id) setTimeout(() => this.refresh(id), 900);
          }
          this.lastRunningCount = running;
        },
        error: (e) => this.jobsError.set(e?.error?.detail ?? e?.message ?? 'Failed to load jobs')
      });
  }

  private addPendingAutoRefresh(type: string) {
    const t = (type ?? '').toString().trim();
    if (!t) return;
    const current = this.pendingAutoRefresh();
    if (current.some((x) => x.type === t)) return;
    this.pendingAutoRefresh.set([...current, { type: t, observed: false }]);
  }

  loadLists(entryId: string) {
    this.listsError.set(null);
    this.api.listLists().subscribe({
      next: (all) => this.allLists.set(all),
      error: () => this.listsError.set('Failed to load lists')
    });
    this.api.getEntryLists(entryId).subscribe({
      next: (sel) => this.selectedListIds.set(sel.map((x) => x.id)),
      error: () => this.listsError.set('Failed to load entry lists')
    });
  }

  toggleList(list: ListResponse) {
    const id = this.id();
    if (!id) return;
    const current = this.selectedListIds();
    const next = current.includes(list.id) ? current.filter((x) => x !== list.id) : [...current, list.id];
    this.selectedListIds.set(next);
    this.scheduleSaveLists();
  }

  private scheduleSaveLists() {
    const id = this.id();
    if (!id) return;
    if (this.listsSaveTimer) clearTimeout(this.listsSaveTimer);
    this.listsSaveTimer = setTimeout(() => {
      this.api.setEntryLists(id, this.selectedListIds()).subscribe({
        next: () => {},
        error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to save lists')
      });
    }, 250);
  }

  onTagsChange(tags: string[]) {
    this.tags.set(tags);
    this.scheduleSaveTags();
  }

  private scheduleSaveTags() {
    const id = this.id();
    if (!id) return;

    if (this.tagsSaveTimer) clearTimeout(this.tagsSaveTimer);
    this.tagsSaveTimer = setTimeout(() => {
      this.api.patchEntry(id, { tags: this.tags() }).subscribe({
        next: () => this.refresh(id),
        error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to save tags')
      });
    }, 250);
  }

  cancelJob(job: JobResponse) {
    this.jobActionError.set(null);
    this.jobActionBusy.set(job.id);
    this.api
      .cancelJob(job.id)
      .pipe(finalize(() => this.jobActionBusy.set(null)))
      .subscribe({
        next: () => {
          const id = this.id();
          if (id) this.loadJobs(id);
        },
        error: (e) => this.jobActionError.set(e?.error?.detail ?? e?.message ?? 'Failed to cancel job')
      });
  }

  removeJob(job: JobResponse) {
    this.jobActionError.set(null);
    this.jobActionBusy.set(job.id);
    this.api
      .deleteJob(job.id)
      .pipe(finalize(() => this.jobActionBusy.set(null)))
      .subscribe({
        next: () => {
          const id = this.id();
          if (id) this.loadJobs(id);
        },
        error: (e) => this.jobActionError.set(e?.error?.detail ?? e?.message ?? 'Failed to delete job')
      });
  }

  deleteEntry() {
    const id = this.id();
    if (!id) return;
    if (!confirm('Delete this entry? This will also remove its attachments and queued jobs.')) return;

    this.api.deleteEntry(id).subscribe({
      next: () => {
        this.entriesStore.refresh();
        void this.router.navigate(['/entries']);
      },
      error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to delete entry')
    });
  }
}


