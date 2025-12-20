import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EntryCardComponent } from '../../components/entry-card/entry-card.component';
import { TagChipsInputComponent } from '../../components/tag-chips-input/tag-chips-input.component';
import type { TagSuggestionResponse } from '../../models/tag-suggestion.model';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';

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

  readonly popularTags = signal<TagSuggestionResponse[]>([]);
  readonly popularTagsError = signal<string | null>(null);

  constructor() {
    this.api.suggestTags('', 30).subscribe({
      next: (items) => this.popularTags.set(items),
      error: () => this.popularTagsError.set('Failed to load tags')
    });

    const tag = this.route.snapshot.queryParamMap.get('tag');
    if (tag && tag.trim()) {
      this.store.setTagFilter([tag.trim().toLowerCase()]);
    }
  }

  applyPopularTag(tag: string) {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    this.store.setTagFilter([t]);
    void this.router.navigate(['/entries'], { queryParams: { tag: t } });
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


