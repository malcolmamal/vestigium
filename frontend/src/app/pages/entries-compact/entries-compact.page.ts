import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, firstValueFrom } from 'rxjs';

import type { EntryListResponse, EntryResponse } from '../../models';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { ToastService } from '../../services/toast.service';
import { SettingsStore } from '../../store/settings.store';

interface SiteColumn {
  key: string;
  label: string;
  count: number;
  items: EntryResponse[];
}

@Component({
  selector: 'app-entries-compact-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './entries-compact.page.html',
  styleUrl: './entries-compact.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntriesCompactPage {
  private readonly api = inject(VestigiumApiService);
  private readonly settings = inject(SettingsStore);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly maxItemsToRender = 500;

  readonly loading = signal(false);
  readonly loadingProgress = signal<string>('');
  readonly error = signal<string | null>(null);
  readonly items = signal<EntryResponse[]>([]);
  readonly totalCount = signal<number>(0);
  readonly partial = signal<boolean>(false);

  private readonly loadSeq = signal(0);

  readonly columns = computed<SiteColumn[]>(() => {
    console.log('[COMPACT] columns() computed - starting with', this.items().length, 'items');
    const items = this.items();
    if (items.length === 0) {
      console.log('[COMPACT] columns() - no items, returning empty');
      return [];
    }

    const counts = new Map<string, number>();
    for (const e of items) {
      const key = siteKeyFromEntry(e);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const topKeys = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);

    const bySite = new Map<string, EntryResponse[]>();
    const other: EntryResponse[] = [];

    for (const e of items) {
      const key = siteKeyFromEntry(e);
      if (topKeys.includes(key)) {
        const arr = bySite.get(key) ?? [];
        arr.push(e);
        bySite.set(key, arr);
      } else {
        other.push(e);
      }
    }

    const cols: SiteColumn[] = topKeys.map((key) => {
      const colItems = bySite.get(key) ?? [];
      return {
        key,
        label: siteLabelFromKey(key),
        count: colItems.length,
        items: colItems
      };
    });

    cols.push({
      key: 'other',
      label: 'Other',
      count: other.length,
      items: other
    });

    console.log('[COMPACT] columns() computed - built', cols.length, 'columns');
    return cols;
  });

  constructor() {
    console.log('[COMPACT] constructor - component created');
    // Initial load. Reload if NSFW toggle changes.
    effect(() => {
      console.log('[COMPACT] effect triggered - calling loadAll()');
      const includeNsfw = this.settings.showNsfw();
      untracked(() => {
        void this.loadAll(includeNsfw);
      });
    });
    console.log('[COMPACT] constructor - effect registered');
  }

  faviconUrl(e: EntryResponse): string | null {
    const host = hostnameFromEntry(e);
    if (!host || host.length < 3) return null;
    const domain = host.replace(/^www\./i, '');
    // Skip localhost and invalid domains
    if (domain === 'localhost' || domain.startsWith('localhost:')) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
  }

  thumbnailUrl(e: EntryResponse): string | null {
    return e.thumbnailUrl ?? null;
  }

  onThumbError(evt: Event) {
    (evt.target as HTMLImageElement).style.display = 'none';
  }

  onFaviconError(evt: Event) {
    (evt.target as HTMLImageElement).style.display = 'none';
  }

  openLink(e: EntryResponse, evt?: Event) {
    if (evt) this.stop(evt);
    if (!e.url) return;
    window.open(e.url, '_blank');
  }

  async deleteEntry(e: EntryResponse, evt: Event) {
    this.stop(evt);
    const id = e.id;
    if (!id) return;
    if (!confirm(`Delete entry?\n\n${e.title || e.url || id}`)) return;

    try {
      await firstValueFrom(this.api.deleteEntry(id));
      this.items.update((curr) => curr.filter((x) => x.id !== id));
      this.totalCount.update((c) => Math.max(0, c - 1));
      this.toasts.success('Entry deleted');
    } catch (err: any) {
      this.toasts.error(err?.message ?? 'Failed to delete entry');
    }
  }

  trackById = (_: number, e: EntryResponse) => e.id ?? e.url ?? '';

  private stop(evt: Event) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  private async loadAll(includeNsfw: boolean) {
    console.log('[COMPACT] loadAll() - starting with includeNsfw:', includeNsfw);
    // Avoid updating state after the component is destroyed.
    const onDestroy = new Promise<void>((resolve) => this.destroyRef.onDestroy(() => resolve()));

    const seq = this.loadSeq() + 1;
    this.loadSeq.set(seq);

    this.loading.set(true);
    this.loadingProgress.set('Starting...');
    this.error.set(null);
    this.partial.set(false);
    console.log('[COMPACT] loadAll() - state reset, starting fetch loop');

    // Rendering too many tiles will freeze the browser.
    // Keep this view intentionally capped; it is meant for quick scanning.
    const pageSize = 100;
    const maxPages = 50; // request safety cap

    let page = 0;
    let total = Number.POSITIVE_INFINITY;
    const all: EntryResponse[] = [];

    try {
      while (all.length < total && all.length < this.maxItemsToRender && page < maxPages) {
        if (this.loadSeq() !== seq) return;

        this.loadingProgress.set(`Loading page ${page + 1}... (${all.length} entries so far)`);

        const res = (await Promise.race([
          firstValueFrom(
            this.api.listEntries({
              page,
              pageSize,
              sort: 'added_desc',
              includeNsfw
            })
          ),
          onDestroy.then(() => null)
        ])) as EntryListResponse | null;

        if (!res) return;

        const items = res.items ?? [];
        total = res.totalCount ?? all.length + items.length;
        for (const it of items) {
          if (all.length >= this.maxItemsToRender) break;
          all.push(it);
        }

        if (items.length === 0) break;
        page += 1;
      }

      this.loadingProgress.set(`Rendering ${all.length} entries...`);
      console.log('[COMPACT] loadAll() - about to set items, count:', all.length);
      this.items.set(all);
      console.log('[COMPACT] loadAll() - items set, computing columns...');
      this.totalCount.set(Number.isFinite(total) ? total : all.length);
      if ((Number.isFinite(total) && all.length < total) || all.length >= this.maxItemsToRender) {
        this.partial.set(true);
      }
    } catch (err: any) {
      this.error.set(err?.message ?? 'Failed to load entries');
      this.items.set([]);
      this.totalCount.set(0);
    } finally {
      if (this.loadSeq() === seq) {
        console.log('[COMPACT] loadAll() - cleanup, setting loading=false');
        this.loading.set(false);
        this.loadingProgress.set('');
      }
      console.log('[COMPACT] loadAll() - finished');
    }
  }
}

function hostnameFromEntry(e: EntryResponse): string | null {
  const url = e.url ?? '';
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function siteKeyFromEntry(e: EntryResponse): string {
  const host = hostnameFromEntry(e);
  if (!host) return 'unknown';

  const h = host.replace(/^www\./i, '');

  if (h === 'youtu.be' || h.endsWith('youtube.com')) return 'youtube';
  if (h.endsWith('reddit.com')) return 'reddit';
  if (h === 'x.com' || h.endsWith('twitter.com')) return 'x';
  if (h.endsWith('github.com')) return 'github';

  // fallback: "registrable" domain-ish (last two labels)
  const parts = h.split('.').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  }
  return h;
}

function siteLabelFromKey(key: string): string {
  if (key === 'youtube') return 'YouTube';
  if (key === 'reddit') return 'Reddit';
  if (key === 'x') return 'X';
  if (key === 'github') return 'GitHub';
  if (key === 'unknown') return 'Unknown';
  return key;
}
