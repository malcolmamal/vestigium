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
