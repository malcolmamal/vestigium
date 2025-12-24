import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EntryCardComponent } from '../../components/entry-card/entry-card.component';
import { TagChipsInputComponent } from '../../components/tag-chips-input/tag-chips-input.component';
import { VideoModalComponent } from '../../components/video-modal/video-modal.component';
import type { ListResponse, TagSuggestionResponse } from '../../models';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';
import { ListsStore } from '../../store/lists.store';
import { JobsStore } from '../../store/jobs.store';

@Component({
  selector: 'app-entries-page',
  standalone: true,
  imports: [RouterLink, EntryCardComponent, TagChipsInputComponent, VideoModalComponent],
  templateUrl: './entries.page.html',
  styleUrl: './entries.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntriesPage {
  readonly store = inject(EntriesStore);
  private readonly api = inject(VestigiumApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly lists = inject(ListsStore);
  readonly jobsStore = inject(JobsStore);

  readonly popularTags = signal<TagSuggestionResponse[]>([]);
  readonly popularTagsError = signal<string | null>(null);
  readonly filtersCollapsed = signal(true);
  readonly activeVideoId = signal<string | null>(null);
  readonly busyStates = signal<Record<string, 'enrich' | 'thumb' | 'important' | 'delete' | null>>(
    {}
  );

  readonly tagSuggestions = signal<TagSuggestionResponse[]>([]);
  readonly tagSuggestionsLoading = signal(false);
  private suggestTimer: ReturnType<typeof setTimeout> | null = null;

  onTagSearch(q: string) {
    if (this.suggestTimer) clearTimeout(this.suggestTimer);
    const query = q.trim().toLowerCase();
    if (query.length < 2) {
      this.tagSuggestions.set([]);
      return;
    }
    this.suggestTimer = setTimeout(() => {
      this.tagSuggestionsLoading.set(true);
      this.api.suggestTags(query, 10).subscribe({
        next: (items) => {
          this.tagSuggestions.set(items);
          this.tagSuggestionsLoading.set(false);
        },
        error: () => {
          this.tagSuggestions.set([]);
          this.tagSuggestionsLoading.set(false);
        }
      });
    }, 200);
  }

  readonly filterSummary = computed(() => {
    // ...
  });

  // ... (inside class)

  onEnrich(id: string) {
    this.updateBusy(id, 'enrich');
    this.api.enqueueEnrich(id).subscribe({
      next: () => {
        this.updateBusy(id, null);
        // no refresh needed, jobs store will handle it via WS
      },
      error: () => this.updateBusy(id, null)
    });
  }

  onThumbnail(id: string) {
    this.updateBusy(id, 'thumb');
    this.api.enqueueThumbnail(id).subscribe({
      next: () => {
        this.updateBusy(id, null);
        // no refresh needed, jobs store will handle it via WS
      },
      error: () => this.updateBusy(id, null)
    });
  }

  onToggleImportant(id: string) {
    const entry = this.store.items().find((e) => e.id === id);
    if (!entry) return;
    this.updateBusy(id, 'important');
    this.api.patchEntry(id, { important: !entry.important }).subscribe({
      next: () => {
        this.updateBusy(id, null);
        this.store.updateItem(id, { important: !entry.important });
      },
      error: () => this.updateBusy(id, null)
    });
  }

  onDelete(id: string) {
    this.updateBusy(id, 'delete');
    this.api.deleteEntry(id).subscribe({
      next: () => {
        this.updateBusy(id, null);
        this.store.removeItem(id);
      },
      error: () => this.updateBusy(id, null)
    });
  }

  private updateBusy(id: string, type: 'enrich' | 'thumb' | 'important' | 'delete' | null) {
    this.busyStates.update((s) => ({ ...s, [id]: type }));
  }

  constructor() {
    this.api.suggestTags('', 15).subscribe({
      next: (items) => this.popularTags.set(items),
      error: () => this.popularTagsError.set('Failed to load tags')
    });

    this.lists.load();

    const tags = this.route.snapshot.queryParamMap.getAll('tags');
    const legacyTag = this.route.snapshot.queryParamMap.get('tag');
    const initial = [...tags, ...(legacyTag ? [legacyTag] : [])]
      .map((t) => (t ?? '').toString().trim().toLowerCase())
      .filter((t) => t.length > 0);
    if (initial.length > 0) {
      this.store.setTagFilter(Array.from(new Set(initial)));
    }
  }

  applyPopularTag(tag: string) {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    const current = this.store.tagFilter();
    const next = current.includes(t)
      ? current.filter((x) => x !== t)
      : Array.from(new Set([...current, t]));
    this.store.setTagFilter(next);
    void this.router.navigate(['/entries'], { queryParams: { tags: next } });
  }

  toggleList(list: ListResponse) {
    const current = this.store.listFilter();
    const id = list.id!;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    this.store.setListFilter(next);
  }

  nextPage() {
    if (this.store.items().length < this.store.pageSize()) return;
    this.store.setPage(this.store.page() + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevPage() {
    this.store.setPage(Math.max(0, this.store.page() - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setPageSize(evt: Event) {
    const v = Number((evt.target as HTMLSelectElement).value || '20');
    this.store.setPageSize([10, 20, 50, 100].includes(v) ? v : 20);
  }

  importantValue(): 'any' | 'true' | 'false' {
    const v = this.store.importantOnly();
    if (v === null) return 'any';
    return v ? 'true' : 'false';
  }

  visitedValue(): 'any' | 'true' | 'false' {
    const v = this.store.visitedOnly();
    if (v === null) return 'any';
    return v ? 'true' : 'false';
  }

  onImportantChange(evt: Event) {
    const v = (evt.target as HTMLSelectElement).value;
    this.store.setImportantOnly(v === 'any' ? null : v === 'true');
  }

  onVisitedChange(evt: Event) {
    const v = (evt.target as HTMLSelectElement).value;
    this.store.setVisitedOnly(v === 'any' ? null : v === 'true');
  }

  onPlayVideo(videoId: string) {
    this.activeVideoId.set(videoId);
  }

  closeVideo() {
    this.activeVideoId.set(null);
  }
}
