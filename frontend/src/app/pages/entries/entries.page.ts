import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EntryCardComponent } from '../../components/entry-card/entry-card.component';
import { TagChipsInputComponent } from '../../components/tag-chips-input/tag-chips-input.component';
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
        <a class="button" routerLink="/entries/new">Add entry</a>
      </header>

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


