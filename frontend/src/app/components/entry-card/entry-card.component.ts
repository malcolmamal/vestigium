import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import type { EntryResponse, JobResponse } from '../../models';
import { extractYouTubeId } from '../../utils/youtube';
import { normalizeUrl } from '../../utils/url';

@Component({
  selector: 'app-entry-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './entry-card.component.html',
  styleUrl: './entry-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntryCardComponent {
  readonly entry = input.required<EntryResponse>();
  readonly activeJobs = input<JobResponse[]>([]);
  readonly busyAction = input<'enrich' | 'thumb' | 'important' | 'delete' | null>(null);

  readonly enrich = output<string>();
  readonly regenerateThumbnail = output<string>();
  readonly toggleImportant = output<string>();
  readonly delete = output<string>();
  readonly playVideo = output<string>();

  readonly busy = computed(() => this.busyAction() !== null);

  readonly hasFailedJob = computed(() => this.entry().latestJobFailed === true);

  readonly jobs = computed(() => {
    const id = this.entry().id;
    if (!id) return [];
    return this.activeJobs().filter((j) => j.entryId === id);
  });

  readonly enrichJobs = computed(() =>
    this.jobs().filter(
      (j) => j.type === 'ENRICH_ENTRY' && (j.status === 'PENDING' || j.status === 'RUNNING')
    )
  );
  readonly thumbJobs = computed(() =>
    this.jobs().filter(
      (j) => j.type === 'REGENERATE_THUMBNAIL' && (j.status === 'PENDING' || j.status === 'RUNNING')
    )
  );
  readonly thumbVersion = signal(Date.now());
  readonly thumbnailUrl = computed(() => {
    const updatedAt = this.entry().updatedAt ?? '';
    return `${this.entry().thumbnailUrl}?v=${this.thumbVersion()}&u=${encodeURIComponent(updatedAt)}`;
  });
  readonly thumbnailLargeUrl = computed(() => {
    const updatedAt = this.entry().updatedAt ?? '';
    return `${this.entry().thumbnailLargeUrl}?v=${this.thumbVersion()}&u=${encodeURIComponent(updatedAt)}`;
  });

  readonly youtubeId = computed(() => extractYouTubeId(this.entry().url || ''));

  readonly showAiContext = signal(false);

  private prevThumbCount = 0;
  private prevUpdatedAt: string | null = null;
  private lastThumbSuccessId: string | null = null;

  constructor() {
    effect(() => {
      const curr = this.thumbJobs().length;
      if (this.prevThumbCount > 0 && curr === 0) {
        this.thumbVersion.set(Date.now());
      }
      this.prevThumbCount = curr;
    });

    // Update thumbnail cache-busting when entry data changes (e.g., after job completion)
    effect(() => {
      const entry = this.entry();
      const updatedAt = entry?.updatedAt;
      if (updatedAt && updatedAt !== this.prevUpdatedAt && this.prevUpdatedAt !== null) {
        // Entry was updated (likely by a job), refresh thumbnail
        this.thumbVersion.set(Date.now());
      }
      this.prevUpdatedAt = updatedAt ?? null;
    });

    // If we missed the RUNNING state, refresh when a thumbnail job succeeds for this entry.
    effect(() => {
      const latestSuccess = this.jobs()
        .filter((j) => j.type === 'REGENERATE_THUMBNAIL' && j.status === 'SUCCEEDED')
        .sort((a, b) => {
          const timeA = new Date(a.finishedAt ?? a.createdAt ?? 0).getTime();
          const timeB = new Date(b.finishedAt ?? b.createdAt ?? 0).getTime();
          return timeB - timeA;
        })[0];

      const nextId = latestSuccess?.id ?? null;
      if (nextId && nextId !== this.lastThumbSuccessId) {
        this.thumbVersion.set(Date.now());
        this.lastThumbSuccessId = nextId;
      }
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

  toggleAiContext(evt: Event) {
    this.stop(evt);
    this.showAiContext.set(!this.showAiContext());
  }

  openLink(evt: MouseEvent) {
    this.stop(evt);
    window.open(normalizeUrl(this.entry().url), '_blank');
  }

  enqueueEnrich(evt: MouseEvent) {
    this.stop(evt);
    this.enrich.emit(this.entry().id!);
  }

  enqueueThumbnail(evt: MouseEvent) {
    this.stop(evt);
    this.regenerateThumbnail.emit(this.entry().id!);
  }

  onToggleImportant(evt: MouseEvent) {
    this.stop(evt);
    this.toggleImportant.emit(this.entry().id!);
  }

  onDelete(evt: MouseEvent) {
    this.stop(evt);
    const e = this.entry();
    if (!confirm(`Delete entry?\n\n${e.title || e.url}`)) return;
    this.delete.emit(this.entry().id!);
  }

  private stop(evt: Event) {
    evt.preventDefault();
    evt.stopPropagation();
  }
}
