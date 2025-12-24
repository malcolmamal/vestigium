import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import type { EntryResponse } from '../../models/entry.model';
import type { JobResponse } from '../../models/job.model';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';

@Component({
  selector: 'app-entry-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './entry-card.component.html',
  styleUrl: './entry-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntryCardComponent {
  private readonly api = inject(VestigiumApiService);
  private readonly entriesStore = inject(EntriesStore);

  readonly entry = input.required<EntryResponse>();
  readonly changed = output<{ kind: 'queued' | 'updated' | 'deleted'; entryId: string }>();

  readonly busyAction = signal<'enrich' | 'thumb' | 'important' | 'delete' | null>(null);
  readonly busy = computed(() => this.busyAction() !== null);
  
  readonly jobs = signal<JobResponse[]>([]);
  readonly enrichJobs = computed(() => 
    this.jobs().filter(j => j.type === 'ENRICH_ENTRY' && (j.status === 'PENDING' || j.status === 'RUNNING'))
  );
  readonly thumbJobs = computed(() => 
    this.jobs().filter(j => j.type === 'REGENERATE_THUMBNAIL' && (j.status === 'PENDING' || j.status === 'RUNNING'))
  );
  readonly thumbVersion = signal(Date.now());
  readonly thumbnailUrl = computed(() => `${this.entry().thumbnailUrl}?v=${this.thumbVersion()}`);

  private pollInterval?: ReturnType<typeof setInterval>;

  constructor() {
    effect(() => {
      const id = this.entry().id;
      this.loadJobs(id);
      this.startPolling(id);
    }, { allowSignalWrites: true });
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private startPolling(entryId: string) {
    this.stopPolling();
    this.pollInterval = setInterval(() => this.loadJobs(entryId), 2000);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }

  private loadJobs(entryId: string) {
    this.api.listJobs({ entryId, status: ['PENDING', 'RUNNING'] }).subscribe({
      next: (jobs) => {
        const prevThumbCount = this.thumbJobs().length;
        this.jobs.set(jobs);
        const currThumbCount = this.thumbJobs().length;
        
        // If thumbnail jobs dropped from >0 to 0, refresh the thumbnail
        if (prevThumbCount > 0 && currThumbCount === 0) {
          this.thumbVersion.set(Date.now());
        }
      },
      error: () => {}
    });
  }

  onImgError(evt: Event) {
    (evt.target as HTMLImageElement).style.display = 'none';
  }

  enqueueEnrich(evt: MouseEvent) {
    this.stop(evt);
    const id = this.entry().id;
    this.busyAction.set('enrich');
    this.api.enqueueEnrich(id).subscribe({
      next: () => {
        this.entriesStore.refresh();
        this.changed.emit({ kind: 'queued', entryId: id });
        this.busyAction.set(null);
      },
      error: () => this.busyAction.set(null)
    });
  }

  enqueueThumbnail(evt: MouseEvent) {
    this.stop(evt);
    const id = this.entry().id;
    this.busyAction.set('thumb');
    this.api.enqueueThumbnail(id).subscribe({
      next: () => {
        this.entriesStore.refresh();
        this.changed.emit({ kind: 'queued', entryId: id });
        this.busyAction.set(null);
      },
      error: () => this.busyAction.set(null)
    });
  }

  toggleImportant(evt: MouseEvent) {
    this.stop(evt);
    const e = this.entry();
    this.busyAction.set('important');
    this.api.patchEntry(e.id, { important: !e.important }).subscribe({
      next: () => {
        this.entriesStore.refresh();
        this.changed.emit({ kind: 'updated', entryId: e.id });
        this.busyAction.set(null);
      },
      error: () => this.busyAction.set(null)
    });
  }

  delete(evt: MouseEvent) {
    this.stop(evt);
    const e = this.entry();
    if (!confirm(`Delete entry?\n\n${e.title || e.url}`)) return;
    this.busyAction.set('delete');
    this.api.deleteEntry(e.id).subscribe({
      next: () => {
        this.entriesStore.refresh();
        this.changed.emit({ kind: 'deleted', entryId: e.id });
        this.busyAction.set(null);
      },
      error: () => this.busyAction.set(null)
    });
  }

  private stop(evt: Event) {
    evt.preventDefault();
    evt.stopPropagation();
  }
}


