import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import type { EntryResponse } from '../../models';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';
import { JobsStore } from '../../store/jobs.store';
import { extractYouTubeId } from '../../utils/youtube';

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
  private readonly jobsStore = inject(JobsStore);

  readonly entry = input.required<EntryResponse>();
  readonly changed = output<{ kind: 'queued' | 'updated' | 'deleted'; entryId: string }>();
  readonly playVideo = output<string>();

  readonly busyAction = signal<'enrich' | 'thumb' | 'important' | 'delete' | null>(null);
  readonly busy = computed(() => this.busyAction() !== null);
  
  readonly jobs = computed(() => {
    const id = this.entry().id;
    if (!id) return [];
    return this.jobsStore.items().filter(j => j.entryId === id);
  });

  readonly enrichJobs = computed(() => 
    this.jobs().filter(j => j.type === 'ENRICH_ENTRY' && (j.status === 'PENDING' || j.status === 'RUNNING'))
  );
  readonly thumbJobs = computed(() => 
    this.jobs().filter(j => j.type === 'REGENERATE_THUMBNAIL' && (j.status === 'PENDING' || j.status === 'RUNNING'))
  );
  readonly thumbVersion = signal(Date.now());
  readonly thumbnailUrl = computed(() => `${this.entry().thumbnailUrl}?v=${this.thumbVersion()}`);

  readonly youtubeId = computed(() => extractYouTubeId(this.entry().url || ''));

  private prevThumbCount = 0;

  constructor() {
    effect(() => {
      const curr = this.thumbJobs().length;
      if (this.prevThumbCount > 0 && curr === 0) {
        this.thumbVersion.set(Date.now());
      }
      this.prevThumbCount = curr;
    });
  }

  openVideo(evt: MouseEvent) {
    this.stop(evt);
    const yId = this.youtubeId();
    if (yId) {
      this.playVideo.emit(yId);
    }
  }

  onImgError(evt: Event) {
    (evt.target as HTMLImageElement).style.display = 'none';
  }

  enqueueEnrich(evt: MouseEvent) {
    this.stop(evt);
    const id = this.entry().id!;
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
    const id = this.entry().id!;
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
    this.api.patchEntry(e.id!, { important: !e.important }).subscribe({
      next: () => {
        this.entriesStore.refresh();
        this.changed.emit({ kind: 'updated', entryId: e.id! });
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
    this.api.deleteEntry(e.id!).subscribe({
      next: () => {
        this.entriesStore.refresh();
        this.changed.emit({ kind: 'deleted', entryId: e.id! });
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
