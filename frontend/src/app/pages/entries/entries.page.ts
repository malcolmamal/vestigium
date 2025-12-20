import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EntryCardComponent } from '../../components/entry-card/entry-card.component';
import { TagChipsInputComponent } from '../../components/tag-chips-input/tag-chips-input.component';
import type { ListResponse } from '../../models/list.model';
import type { TagSuggestionResponse } from '../../models/tag-suggestion.model';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';
import { ListsStore } from '../../store/lists.store';

@Component({
  selector: 'app-entries-page',
  standalone: true,
  imports: [RouterLink, EntryCardComponent, TagChipsInputComponent],
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

  readonly popularTags = signal<TagSuggestionResponse[]>([]);
  readonly popularTagsError = signal<string | null>(null);

  readonly listCreateName = signal('');
  readonly listError = signal<string | null>(null);

  constructor() {
    this.api.suggestTags('', 20).subscribe({
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
    const next = Array.from(new Set([...this.store.tagFilter(), t]));
    this.store.setTagFilter(next);
    void this.router.navigate(['/entries'], { queryParams: { tags: next } });
  }

  toggleList(list: ListResponse) {
    const current = this.store.listFilter();
    const id = list.id;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    this.store.setListFilter(next);
  }

  createList() {
    const name = this.listCreateName().trim();
    if (!name) return;
    this.listError.set(null);
    this.api.createList(name).subscribe({
      next: () => {
        this.listCreateName.set('');
        this.lists.load();
      },
      error: (e) => this.listError.set(e?.error?.detail ?? e?.message ?? 'Failed to create list')
    });
  }

  deleteList(list: ListResponse) {
    this.listError.set(null);
    this.api.deleteList(list.id, false).subscribe({
      next: () => this.lists.load(),
      error: (e) => {
        const detail = e?.error?.detail ?? e?.message ?? 'Failed to delete list';
        // If non-empty, ask for confirmation and retry with force.
        if (String(e?.error?.title ?? '').includes('LIST_NOT_EMPTY') || String(detail).includes('linked entries')) {
          if (confirm(`Delete list \"${list.name}\"? It has ${list.entryCount} linked entries.`)) {
            this.api.deleteList(list.id, true).subscribe({
              next: () => this.lists.load(),
              error: (e2) => this.listError.set(e2?.error?.detail ?? e2?.message ?? 'Failed to delete list')
            });
            return;
          }
          return;
        }
        this.listError.set(detail);
      }
    });
  }

  nextPage() {
    if (this.store.items().length < this.store.pageSize()) return;
    this.store.page.set(this.store.page() + 1);
  }

  prevPage() {
    this.store.page.set(Math.max(0, this.store.page() - 1));
  }

  setPageSize(evt: Event) {
    const v = Number((evt.target as HTMLSelectElement).value || '20');
    this.store.pageSize.set([20, 50, 100].includes(v) ? v : 20);
    this.store.page.set(0);
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
    this.store.importantOnly.set(v === 'any' ? null : v === 'true');
  }

  onVisitedChange(evt: Event) {
    const v = (evt.target as HTMLSelectElement).value;
    this.store.visitedOnly.set(v === 'any' ? null : v === 'true');
  }
}


