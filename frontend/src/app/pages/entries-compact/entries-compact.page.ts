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
import { firstValueFrom } from 'rxjs';

import type { EntryListResponse, EntryResponse } from '../../models';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { ToastService } from '../../services/toast.service';
import { SettingsStore } from '../../store/settings.store';
import { extractYouTubeId } from '../../utils/youtube';
import { normalizeUrl } from '../../utils/url';
import { VideoModalComponent } from '../../components/video-modal/video-modal.component';

interface SiteColumn {
  key: string;
  label: string;
  count: number;
  items: EntryResponse[];
}

@Component({
  selector: 'app-entries-compact-page',
  standalone: true,
  imports: [RouterLink, VideoModalComponent],
  templateUrl: './entries-compact.page.html',
  styleUrl: './entries-compact.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntriesCompactPage {
  private readonly api = inject(VestigiumApiService);
  readonly settings = inject(SettingsStore);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly maxItemsToRender = 500;

  readonly loading = signal(false);
  readonly loadingProgress = signal<string>('');
  readonly error = signal<string | null>(null);
  readonly items = signal<EntryResponse[]>([]);
  readonly totalCount = signal<number>(0);
  readonly partial = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly activeVideoId = signal<string | null>(null);
  readonly viewMode = signal<'sites' | 'reddit'>('sites');

  private readonly loadSeq = signal(0);
  readonly columnSort = signal<
    Record<
      string,
      'date_asc' | 'date_desc' | 'name_asc' | 'name_desc' | 'domain_asc' | 'domain_desc'
    >
  >({
    youtube: 'date_desc',
    reddit: 'date_desc',
    x: 'date_desc',
    github: 'date_desc',
    other: 'date_desc'
  });

  readonly columns = computed<SiteColumn[]>(() => {
    console.log('[COMPACT] columns() computed - starting with', this.items().length, 'items');
    const allItems = this.items();
    const query = this.searchQuery().toLowerCase().trim();

    // Filter items based on search query
    const items = query
      ? allItems.filter((e) => {
          const title = (e.title || '').toLowerCase();
          const url = (e.url || '').toLowerCase();
          return title.includes(query) || url.includes(query);
        })
      : allItems;

    if (items.length === 0) {
      console.log('[COMPACT] columns() - no items after filtering, returning empty');
      return [];
    }

    const mode = this.viewMode();
    const limit = this.settings.compactColumns();

    if (mode === 'reddit') {
      const redditItems = items.filter((e) => siteKeyFromEntry(e) === 'reddit');
      const subCounts = new Map<string, number>();
      for (const e of redditItems) {
        const sub = extractSubreddit(e.url ?? '');
        subCounts.set(sub, (subCounts.get(sub) ?? 0) + 1);
      }

      const topSubs = Array.from(subCounts.entries())
        .filter(([sub]) => sub !== 'Other')
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([s]) => s);

      const bySub = new Map<string, EntryResponse[]>();
      const other: EntryResponse[] = [];

      for (const e of redditItems) {
        const sub = extractSubreddit(e.url ?? '');
        if (topSubs.includes(sub)) {
          const arr = bySub.get(sub) ?? [];
          arr.push(e);
          bySub.set(sub, arr);
        } else {
          other.push(e);
        }
      }

      const sortMap = this.columnSort();
      const cols: SiteColumn[] = topSubs.map((sub) => {
        const colItems = bySub.get(sub) ?? [];
        const sorted = this.sortItems(colItems, sortMap[sub] ?? 'date_desc');
        return {
          key: sub,
          label: sub,
          count: sorted.length,
          items: sorted
        };
      });

      if (other.length > 0) {
        const sortedOther = this.sortItems(other, sortMap['other'] ?? 'date_desc');
        cols.push({
          key: 'other',
          label: 'Other Subreddits',
          count: sortedOther.length,
          items: sortedOther
        });
      }
      return cols;
    }

    // Default 'sites' mode
    const counts = new Map<string, number>();
    for (const e of items) {
      const key = siteKeyFromEntry(e);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const topKeys = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
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

    const sortMap = this.columnSort();
    const cols: SiteColumn[] = topKeys.map((key) => {
      const colItems = bySite.get(key) ?? [];
      const sorted = this.sortItems(colItems, sortMap[key] ?? 'date_desc');
      return {
        key,
        label: siteLabelFromKey(key),
        count: sorted.length,
        items: sorted
      };
    });

    const sortedOther = this.sortItems(other, sortMap['other'] ?? 'date_desc');
    cols.push({
      key: 'other',
      label: 'Other',
      count: sortedOther.length,
      items: sortedOther
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
    let domain = host.replace(/^www\./i, '');
    // Also handle old.reddit.com by normalizing to reddit.com
    domain = domain.replace(/^old\./i, '');
    // Skip localhost and invalid domains
    if (domain === 'localhost' || domain.startsWith('localhost:')) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
  }

  siteName(e: EntryResponse): string {
    return siteLabelFromKey(siteKeyFromEntry(e));
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

  hasYouTubeId(e: EntryResponse): string | null {
    return e.url ? extractYouTubeId(e.url) : null;
  }

  onPlayVideo(videoId: string, evt?: Event) {
    if (evt) this.stop(evt);
    this.activeVideoId.set(videoId);
  }

  closeVideo() {
    this.activeVideoId.set(null);
  }

  incrementColumns() {
    this.settings.setCompactColumns(Math.min(20, this.settings.compactColumns() + 1));
  }

  decrementColumns() {
    this.settings.setCompactColumns(Math.max(1, this.settings.compactColumns() - 1));
  }

  openLink(e: EntryResponse, evt?: Event) {
    if (evt) this.stop(evt);
    if (!e.url) return;
    window.open(normalizeUrl(e.url), '_blank');
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
    } catch (err: unknown) {
      this.toasts.error((err as Error)?.message ?? 'Failed to delete entry');
    }
  }

  trackById = (_: number, e: EntryResponse) => e.id ?? e.url ?? '';

  toggleDateSort(colKey: string) {
    this.columnSort.update((curr) => {
      const current = curr[colKey];
      const newSort = current === 'date_desc' ? 'date_asc' : 'date_desc';
      return { ...curr, [colKey]: newSort };
    });
  }

  toggleNameSort(colKey: string) {
    this.columnSort.update((curr) => {
      const current = curr[colKey];
      const newSort = current === 'name_asc' ? 'name_desc' : 'name_asc';
      return { ...curr, [colKey]: newSort };
    });
  }

  isDateSort(colKey: string): boolean {
    const sort = this.columnSort()[colKey];
    return sort === 'date_asc' || sort === 'date_desc';
  }

  isNameSort(colKey: string): boolean {
    const sort = this.columnSort()[colKey];
    return sort === 'name_asc' || sort === 'name_desc';
  }

  getDateSortIcon(colKey: string): string {
    return this.columnSort()[colKey] === 'date_asc' ? '↑' : '↓';
  }

  getNameSortIcon(colKey: string): string {
    return this.columnSort()[colKey] === 'name_asc' ? '↑' : '↓';
  }

  getDateSortTitle(colKey: string): string {
    return this.columnSort()[colKey] === 'date_asc'
      ? 'Sort by date (newest first)'
      : 'Sort by date (oldest first)';
  }

  getNameSortTitle(colKey: string): string {
    return this.columnSort()[colKey] === 'name_asc' ? 'Sort by name (Z-A)' : 'Sort by name (A-Z)';
  }

  toggleDomainSort(colKey: string) {
    this.columnSort.update((curr) => {
      const current = curr[colKey];
      const newSort = current === 'domain_asc' ? 'domain_desc' : 'domain_asc';
      return { ...curr, [colKey]: newSort };
    });
  }

  isDomainSort(colKey: string): boolean {
    const sort = this.columnSort()[colKey];
    return sort === 'domain_asc' || sort === 'domain_desc';
  }

  getDomainSortIcon(colKey: string): string {
    return this.columnSort()[colKey] === 'domain_asc' ? '↑' : '↓';
  }

  getDomainSortTitle(colKey: string): string {
    const isReddit = this.viewMode() === 'reddit';
    const label = isReddit ? 'subreddit' : 'domain';
    return this.columnSort()[colKey] === 'domain_asc'
      ? `Sort by ${label} (Z-A)`
      : `Sort by ${label} (A-Z)`;
  }

  private sortItems(
    items: EntryResponse[],
    sort: 'date_asc' | 'date_desc' | 'name_asc' | 'name_desc' | 'domain_asc' | 'domain_desc'
  ): EntryResponse[] {
    const copy = [...items];
    if (sort === 'date_asc') {
      copy.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });
    } else if (sort === 'date_desc') {
      copy.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sort === 'name_asc') {
      copy.sort((a, b) => {
        const nameA = (a.title || a.url || '').toLowerCase();
        const nameB = (b.title || b.url || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sort === 'name_desc') {
      copy.sort((a, b) => {
        const nameA = (a.title || a.url || '').toLowerCase();
        const nameB = (b.title || b.url || '').toLowerCase();
        return nameB.localeCompare(nameA);
      });
    } else if (sort === 'domain_asc') {
      const mode = this.viewMode();
      copy.sort((a, b) => {
        const keyA = mode === 'reddit' ? extractSubreddit(a.url ?? '') : siteKeyFromEntry(a);
        const keyB = mode === 'reddit' ? extractSubreddit(b.url ?? '') : siteKeyFromEntry(b);
        return keyA.localeCompare(keyB);
      });
    } else if (sort === 'domain_desc') {
      const mode = this.viewMode();
      copy.sort((a, b) => {
        const keyA = mode === 'reddit' ? extractSubreddit(a.url ?? '') : siteKeyFromEntry(a);
        const keyB = mode === 'reddit' ? extractSubreddit(b.url ?? '') : siteKeyFromEntry(b);
        return keyB.localeCompare(keyA);
      });
    }
    return copy;
  }

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
    } catch (err: unknown) {
      this.error.set((err as Error)?.message ?? 'Failed to load entries');
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

function extractSubreddit(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname;
    const match = path.match(/^\/(r|u|user)\/([^/]+)/i);
    if (match) {
      const type = match[1].toLowerCase();
      const name = match[2];
      return type === 'r' ? `r/${name}` : `u/${name}`;
    }
  } catch {
    // ignore
  }
  return 'Other';
}
