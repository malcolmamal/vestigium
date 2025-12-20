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
  template: `
    <section class="page">
      <header class="pageHeader">
        <div>
          <h1>Vestigium</h1>
          <p class="muted">Your repository of links.</p>
        </div>
        <div class="headerActions">
          <a class="button secondary" routerLink="/entries/bulk">Bulk add</a>
          <a class="button secondary" routerLink="/entries/import-export">Import/Export</a>
          <a class="button" routerLink="/entries/new">Add entry</a>
        </div>
      </header>

      <section class="tagsSection">
        <div class="tagsHeader">
          <span class="tagsTitle">Tags</span>
          <span class="muted">Most used</span>
        </div>
        @if (popularTagsError()) {
          <div class="muted">{{ popularTagsError() }}</div>
        } @else if (popularTags().length === 0) {
          <div class="muted">No tags yet.</div>
        } @else {
          <div class="tagPills">
            @for (t of popularTags(); track t.name) {
              <button class="pill" type="button" (click)="applyPopularTag(t.name)">
                {{ t.name }} <span class="count">{{ t.count }}</span>
              </button>
            }
          </div>
        }
      </section>

      <section class="listsSection">
        <div class="listsHeader">
          <span class="listsTitle">Lists</span>
          <span class="muted">Filter + manage</span>
        </div>

        <div class="listCreate">
          <input
            class="textInput"
            type="text"
            placeholder="New list name…"
            [value]="listCreateName()"
            (input)="listCreateName.set(($any($event.target).value ?? '').toString())"
            (keydown.enter)="createList()"
          />
          <button class="button secondary" type="button" (click)="createList()">Add list</button>
        </div>

        @if (listError()) {
          <div class="muted">{{ listError() }}</div>
        }

        @if (lists.error()) {
          <div class="muted">{{ lists.error() }}</div>
        } @else if (lists.loading() && lists.items().length === 0) {
          <div class="muted">Loading lists…</div>
        } @else if (lists.items().length === 0) {
          <div class="muted">No lists yet.</div>
        } @else {
          <div class="listPills">
            @for (l of lists.items(); track l.id) {
              <div class="listPillWrap">
                <button
                  class="pill"
                  type="button"
                  [class.on]="store.listFilter().includes(l.id)"
                  (click)="toggleList(l)"
                >
                  {{ l.name }} <span class="count">{{ l.entryCount }}</span>
                </button>
                <button class="x" type="button" title="Delete list" (click)="deleteList(l)">×</button>
              </div>
            }
          </div>
        }
      </section>

      <div class="filters">
        <label class="field">
          <span class="label">Search</span>
          <input
            class="textInput"
            type="text"
            [value]="store.query()"
            (input)="store.query.set(($any($event.target).value ?? '').toString())"
            placeholder="Search title/description…"
          />
        </label>

        <label class="field">
          <span class="label">Tags</span>
          <app-tag-chips-input
            [tags]="store.tagFilter()"
            placeholder="Type tag and press Enter"
            [hint]="'Filter requires ALL selected tags'"
            (tagsChange)="store.setTagFilter($event)"
          />
        </label>

        <div class="row">
          <label class="field">
            <span class="label">Added from</span>
            <input
              class="textInput"
              type="date"
              [value]="store.addedFrom() ?? ''"
              (input)="store.addedFrom.set(($any($event.target).value ?? '').toString() || null)"
            />
          </label>
          <label class="field">
            <span class="label">Added to</span>
            <input
              class="textInput"
              type="date"
              [value]="store.addedTo() ?? ''"
              (input)="store.addedTo.set(($any($event.target).value ?? '').toString() || null)"
            />
          </label>
        </div>

        <div class="row">
          <label class="field">
            <span class="label">Important</span>
            <select class="select" [value]="importantValue()" (change)="onImportantChange($event)">
              <option value="any">Any</option>
              <option value="true">Important only</option>
              <option value="false">Not important</option>
            </select>
          </label>
          <label class="field">
            <span class="label">Visited</span>
            <select class="select" [value]="visitedValue()" (change)="onVisitedChange($event)">
              <option value="any">Any</option>
              <option value="true">Visited only</option>
              <option value="false">Not visited</option>
            </select>
          </label>
        </div>

        <label class="field">
          <span class="label">Sort</span>
          <select
            class="select"
            [value]="store.sort()"
            (change)="store.sort.set(($any($event.target).value ?? 'updated_desc').toString())"
          >
            <option value="updated_desc">Updated (newest)</option>
            <option value="updated_asc">Updated (oldest)</option>
            <option value="added_desc">Added (newest)</option>
            <option value="added_asc">Added (oldest)</option>
          </select>
        </label>

        <div class="pager">
          <button class="button secondary" type="button" (click)="prevPage()" [disabled]="store.page() === 0">
            Prev
          </button>
          <div class="muted">Page {{ store.page() + 1 }}</div>
          <button
            class="button secondary"
            type="button"
            (click)="nextPage()"
            [disabled]="store.items().length < store.pageSize()"
          >
            Next
          </button>
          <div class="spacer"></div>
          <label class="field inline">
            <span class="label">Per page</span>
            <select class="select" [value]="store.pageSize()" (change)="setPageSize($event)">
              <option [value]="20">20</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>
          </label>
        </div>
      </div>

      @if (store.error()) {
        <div class="error">{{ store.error() }}</div>
      }

      @if (store.loading()) {
        <div class="muted">Loading…</div>
      } @else if (store.items().length === 0) {
        <div class="empty">No entries yet.</div>
      } @else {
        <div class="grid">
          @for (e of store.items(); track e.id) {
            <app-entry-card [entry]="e" />
          }
        </div>
      }
    </section>
  `,
  styles: `
    .page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px;
    }
    .pageHeader {
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .headerActions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .muted {
      color: rgba(255, 255, 255, 0.7);
      margin: 6px 0 0 0;
    }
    h1 {
      margin: 0;
      font-size: 28px;
      letter-spacing: -0.02em;
    }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 14px;
      border-radius: 10px;
      text-decoration: none;
      color: white;
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.18);
    }
    .button:hover {
      background: rgba(255, 255, 255, 0.18);
    }
    .button.secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
    }
    .tagsSection {
      padding: 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.10);
      margin-bottom: 18px;
    }
    .tagsHeader {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 10px;
    }
    .tagsTitle {
      font-weight: 650;
      letter-spacing: -0.01em;
    }
    .tagPills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pill {
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.9);
      border-radius: 999px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 13px;
    }
    .pill:hover {
      background: rgba(255, 255, 255, 0.10);
    }
    .pill .count {
      margin-left: 6px;
      color: rgba(255, 255, 255, 0.65);
      font-size: 12px;
    }
    .pill.on {
      background: rgba(90, 97, 255, 0.14);
      border-color: rgba(90, 97, 255, 0.24);
    }
    .listsSection {
      padding: 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.10);
      margin-bottom: 18px;
      display: grid;
      gap: 10px;
    }
    .listsHeader {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
    }
    .listsTitle {
      font-weight: 650;
      letter-spacing: -0.01em;
    }
    .listCreate {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }
    .listPills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .listPillWrap {
      display: inline-flex;
      gap: 6px;
      align-items: center;
    }
    .x {
      width: 28px;
      height: 28px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      line-height: 1;
      font-size: 16px;
    }
    .x:hover {
      background: rgba(255, 80, 80, 0.12);
      border-color: rgba(255, 80, 80, 0.22);
      color: rgba(255, 220, 220, 0.95);
    }
    .pager {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .field.inline {
      grid-template-columns: auto auto;
      align-items: center;
      gap: 8px;
    }
    .filters {
      display: grid;
      gap: 14px;
      padding: 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.10);
      margin-bottom: 18px;
    }
    .field {
      display: grid;
      gap: 6px;
    }
    .label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }
    .textInput,
    .select {
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.92);
      padding: 10px 10px;
      outline: none;
      font-size: 14px;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 12px;
    }
    .empty {
      color: rgba(255, 255, 255, 0.7);
      padding: 12px;
      border: 1px dashed rgba(255, 255, 255, 0.16);
      border-radius: 14px;
    }
    .error {
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(255, 80, 80, 0.14);
      border: 1px solid rgba(255, 80, 80, 0.25);
      color: rgba(255, 220, 220, 0.92);
      margin-bottom: 12px;
    }
  `,
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


