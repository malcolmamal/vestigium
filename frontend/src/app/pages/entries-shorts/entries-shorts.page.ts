import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import type { EntryResponse } from '../../models';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { SettingsStore } from '../../store/settings.store';
import { extractYouTubeId } from '../../utils/youtube';
import { normalizeUrl } from '../../utils/url';
import { VideoModalComponent } from '../../components/video-modal/video-modal.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-entries-shorts-page',
  standalone: true,
  imports: [CommonModule, RouterLink, VideoModalComponent],
  templateUrl: './entries-shorts.page.html',
  styleUrl: './entries-shorts.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntriesShortsPage implements AfterViewInit {
  private readonly api = inject(VestigiumApiService);
  readonly settings = inject(SettingsStore);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toasts = inject(ToastService);

  readonly items = signal<EntryResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(0);
  readonly totalCount = signal<number | null>(null);
  readonly activeVideoId = signal<string | null>(null);
  readonly iframeUrl = signal<SafeResourceUrl | null>(null);
  readonly iframeTitle = signal<string>('');
  readonly iframeRawUrl = signal<string>('');
  readonly busyStates = signal<Record<string, 'enrich' | 'thumb' | 'important' | 'delete' | null>>(
    {}
  );

  private readonly pageSize = 20;
  private observer: IntersectionObserver | null = null;
  private currentIndex = 0;
  private wheelListener?: (evt: WheelEvent) => void;
  private keyListener?: (evt: KeyboardEvent) => void;

  @ViewChild('sentinel') sentinelRef?: ElementRef<HTMLDivElement>;
  @ViewChild('scroller') scrollerRef?: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      const includeNsfw = this.settings.showNsfw();
      untracked(() => {
        this.resetAndLoad(includeNsfw);
      });
    });

    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.observer = null;
      const scroller = this.scrollerRef?.nativeElement;
      if (scroller && this.wheelListener) {
        scroller.removeEventListener('wheel', this.wheelListener as EventListener);
      }
      if (scroller && this.keyListener) {
        scroller.removeEventListener('keydown', this.keyListener as EventListener);
      }
    });
  }

  ngAfterViewInit(): void {
    const root = this.scrollerRef?.nativeElement;
    const target = this.sentinelRef?.nativeElement;
    if (!root || !target) {
      console.log('[SHORTS] ngAfterViewInit: missing refs', { root: !!root, target: !!target });
      return;
    }

    console.log('[SHORTS] ngAfterViewInit: setting up observers and listeners');

    this.observer = new IntersectionObserver(
      (entries) => {
        console.log('[SHORTS] Sentinel intersection:', entries[0]?.isIntersecting);
        if (entries.some((e) => e.isIntersecting)) {
          console.log('[SHORTS] Sentinel visible, loading next page');
          this.loadNextPage();
        }
      },
      { root, rootMargin: '200px' }
    );

    // Don't observe sentinel yet - wait until first page loads (see loadPage method)

    this.wheelListener = (evt: WheelEvent) => this.onWheel(evt);
    root.addEventListener('wheel', this.wheelListener, { passive: false });
    console.log('[SHORTS] Wheel listener attached');

    this.keyListener = (evt: KeyboardEvent) => this.onKeyDown(evt);
    root.addEventListener('keydown', this.keyListener);
    console.log('[SHORTS] Key listener attached');

    // Auto-focus the scroller so keyboard works immediately
    setTimeout(() => root.focus(), 100);
  }

  scrollToTop() {
    this.scrollerRef?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openPreview(entry: EntryResponse) {
    const url = normalizeUrl(entry.url || '');
    if (!url) return;
    this.iframeTitle.set(entry.title || entry.url || '');
    this.iframeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    this.iframeRawUrl.set(url);
  }

  openMedia(entry: EntryResponse) {
    const yId = this.youtubeId(entry);
    if (yId) {
      this.openVideo(yId);
      return;
    }
    this.openPreview(entry);
  }

  closePreview() {
    this.iframeUrl.set(null);
    this.iframeTitle.set('');
    this.iframeRawUrl.set('');
  }

  openVideo(videoId: string) {
    this.activeVideoId.set(videoId);
  }

  closeVideo() {
    this.activeVideoId.set(null);
  }

  youtubeId(entry: EntryResponse): string | null {
    return entry.url ? extractYouTubeId(entry.url) : null;
  }

  entryType(entry: EntryResponse): { key: string; label: string } {
    const url = (entry.url || '').toLowerCase();
    if (url.includes('youtube.com') || url.includes('youtu.be'))
      return { key: 'youtube', label: 'YouTube' };
    if (url.includes('reddit.com')) return { key: 'reddit', label: 'Reddit' };
    if (url.includes('github.com')) return { key: 'github', label: 'GitHub' };
    if (url.includes('x.com') || url.includes('twitter.com')) return { key: 'x', label: 'X' };
    if (url.includes('news.ycombinator.com')) return { key: 'hn', label: 'Hacker News' };
    return { key: 'link', label: 'Link' };
  }

  faviconUrl(entry: EntryResponse): string | null {
    const host = this.hostnameFromEntry(entry);
    if (!host || host.length < 3) return null;
    let domain = host.replace(/^www\./i, '');
    domain = domain.replace(/^old\./i, '');
    if (domain === 'localhost' || domain.startsWith('localhost:')) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
  }

  onWheel(evt: WheelEvent) {
    // Allow browser zoom with Ctrl/Cmd + wheel
    if (evt.ctrlKey || evt.metaKey || evt.shiftKey || evt.altKey) {
      return;
    }

    if (Math.abs(evt.deltaY) < 1) return;

    const scroller = this.scrollerRef?.nativeElement;
    if (!scroller) return;

    const items = Array.from(scroller.querySelectorAll<HTMLElement>('.shortItem'));
    if (items.length === 0) return;

    evt.preventDefault();

    const direction = evt.deltaY > 0 ? 1 : -1;
    this.currentIndex = Math.max(0, Math.min(items.length - 1, this.currentIndex + direction));

    items[this.currentIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Load more when approaching the end
    if (this.currentIndex >= items.length - 5) {
      this.loadNextPage();
    }
  }

  onKeyDown(evt: KeyboardEvent) {
    if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(evt.key)) {
      return;
    }

    const scroller = this.scrollerRef?.nativeElement;
    if (!scroller) return;

    const items = Array.from(scroller.querySelectorAll<HTMLElement>('.shortItem'));
    if (items.length === 0) return;

    evt.preventDefault();

    if (evt.key === 'ArrowDown' || evt.key === 'PageDown') this.currentIndex++;
    if (evt.key === 'ArrowUp' || evt.key === 'PageUp') this.currentIndex--;
    if (evt.key === 'Home') this.currentIndex = 0;
    if (evt.key === 'End') this.currentIndex = items.length - 1;

    this.currentIndex = Math.max(0, Math.min(items.length - 1, this.currentIndex));

    items[this.currentIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Load more when approaching the end
    if (this.currentIndex >= items.length - 5) {
      this.loadNextPage();
    }
  }

  thumbnailUrl(entry: EntryResponse): string | null {
    const updatedAt = entry.updatedAt ?? '';
    return entry.thumbnailLargeUrl
      ? `${entry.thumbnailLargeUrl}?u=${encodeURIComponent(updatedAt)}`
      : entry.thumbnailUrl
        ? `${entry.thumbnailUrl}?u=${encodeURIComponent(updatedAt)}`
        : null;
  }

  normalizedUrl(entry: EntryResponse): string {
    return normalizeUrl(entry.url || '');
  }

  onThumbError(evt: Event) {
    (evt.target as HTMLImageElement).style.display = 'none';
  }

  onFaviconError(evt: Event) {
    (evt.target as HTMLImageElement).style.display = 'none';
  }

  onEnrich(id: string) {
    this.updateBusy(id, 'enrich');
    this.api.enqueueEnrich(id).subscribe({
      next: () => {
        this.updateBusy(id, null);
        this.toasts.success('Enrichment job queued');
      },
      error: (err) => {
        this.updateBusy(id, null);
        this.toasts.error(err?.message ?? 'Failed to queue enrichment');
      }
    });
  }

  onThumbnail(id: string) {
    this.updateBusy(id, 'thumb');
    this.api.enqueueThumbnail(id).subscribe({
      next: () => {
        this.updateBusy(id, null);
        this.toasts.success('Thumbnail regeneration queued');
      },
      error: (err) => {
        this.updateBusy(id, null);
        this.toasts.error(err?.message ?? 'Failed to queue thumbnail regeneration');
      }
    });
  }

  onToggleImportant(id: string) {
    const entry = this.items().find((e) => e.id === id);
    if (!entry) return;
    this.updateBusy(id, 'important');
    const newState = !entry.important;
    this.api.patchEntry(id, { important: newState }).subscribe({
      next: () => {
        this.updateBusy(id, null);
        this.items.update((items) =>
          items.map((e) => (e.id === id ? { ...e, important: newState } : e))
        );
        this.toasts.success(newState ? 'Marked as important' : 'Removed from important');
      },
      error: (err) => {
        this.updateBusy(id, null);
        this.toasts.error(err?.message ?? 'Failed to update importance');
      }
    });
  }

  onDelete(id: string) {
    const entry = this.items().find((e) => e.id === id);
    const label = entry?.title || entry?.url || 'this entry';
    if (!confirm(`Delete entry?\n\n${label}`)) return;
    this.updateBusy(id, 'delete');
    this.api.deleteEntry(id).subscribe({
      next: () => {
        this.updateBusy(id, null);
        this.items.update((items) => items.filter((e) => e.id !== id));
        this.toasts.success('Entry deleted');
      },
      error: (err) => {
        this.updateBusy(id, null);
        this.toasts.error(err?.message ?? 'Failed to delete entry');
      }
    });
  }

  private resetAndLoad(includeNsfw: boolean) {
    this.items.set([]);
    this.page.set(0);
    this.totalCount.set(null);
    this.error.set(null);
    this.loadPage(0, includeNsfw);
  }

  private loadNextPage() {
    console.log(
      '[SHORTS] loadNextPage called. loading=',
      this.loading(),
      'items=',
      this.items().length,
      'total=',
      this.totalCount()
    );
    if (this.loading()) return;
    const total = this.totalCount();
    if (total !== null && this.items().length >= total) return;
    console.log('[SHORTS] Loading page', this.page() + 1);
    this.loadPage(this.page() + 1, this.settings.showNsfw());
  }

  private loadPage(page: number, includeNsfw: boolean) {
    this.loading.set(true);
    this.api
      .listEntries({
        page,
        pageSize: this.pageSize,
        includeNsfw,
        sort: 'added_desc'
      })
      .subscribe({
        next: (res) => {
          const nextItems = res.items ?? [];
          this.items.update((items) => (page === 0 ? nextItems : [...items, ...nextItems]));
          this.page.set(res.page ?? page);
          this.totalCount.set(res.totalCount ?? null);
          this.loading.set(false);

          // Start observing sentinel after first page loads
          if (page === 0) {
            setTimeout(() => {
              const target = this.sentinelRef?.nativeElement;
              if (target && this.observer) {
                console.log('[SHORTS] Starting to observe sentinel after first load');
                this.observer.observe(target);
              }
            }, 100);
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.message ?? 'Failed to load entries');
        }
      });
  }

  private updateBusy(id: string, type: 'enrich' | 'thumb' | 'important' | 'delete' | null) {
    this.busyStates.update((s) => ({ ...s, [id]: type }));
  }

  private hostnameFromEntry(entry: EntryResponse): string | null {
    const raw = normalizeUrl(entry.url || '');
    if (!raw) return null;
    try {
      return new URL(raw).hostname || null;
    } catch {
      return null;
    }
  }
}
