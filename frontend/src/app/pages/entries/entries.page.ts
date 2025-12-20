import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  readonly filtersCollapsed = signal(true);
  readonly filterSummary = computed(() => {
    const parts: string[] = [];
    const q = this.store.query().trim();
    if (q) parts.push(`q="${q}"`);
    if (this.store.tagFilter().length > 0) parts.push(`${this.store.tagFilter().length} tag(s)`);
    if (this.store.listFilter().length > 0) parts.push(`${this.store.listFilter().length} list(s)`);
    if (this.store.addedFrom()) parts.push(`from ${this.store.addedFrom()}`);
    if (this.store.addedTo()) parts.push(`to ${this.store.addedTo()}`);
    if (this.store.importantOnly() !== null) parts.push(this.store.importantOnly() ? 'important' : 'not important');
    if (this.store.visitedOnly() !== null) parts.push(this.store.visitedOnly() ? 'visited' : 'not visited');
    if (this.store.sort() !== 'updated_desc') parts.push(`sort=${this.store.sort()}`);
    return parts.length > 0 ? parts.join(' · ') : 'No filters';
  });

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
    const next = current.includes(t) ? current.filter((x) => x !== t) : Array.from(new Set([...current, t]));
    this.store.setTagFilter(next);
    void this.router.navigate(['/entries'], { queryParams: { tags: next } });
  }

  toggleList(list: ListResponse) {
    const current = this.store.listFilter();
    const id = list.id;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    this.store.setListFilter(next);
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
    this.store.pageSize.set([10, 20, 50, 100].includes(v) ? v : 20);
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


