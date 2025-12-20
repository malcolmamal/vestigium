import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { TagSuggestionResponse } from '../../models/tag-suggestion.model';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';

@Component({
  selector: 'app-tags-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="pageHeader">
        <h1>Tags</h1>
        <a class="button secondary" routerLink="/entries">Back to entries</a>
      </header>

      <div class="card">
        <label class="field">
          <span class="label">Search</span>
          <input
            class="textInput"
            type="text"
            placeholder="Type at least 2 characters…"
            [value]="prefix()"
            (input)="onPrefix(($any($event.target).value ?? '').toString())"
          />
        </label>
        <div class="muted">Click a tag to add it to the Entries filter.</div>
      </div>

      @if (error()) {
        <div class="errorBox">{{ error() }}</div>
      } @else if (loading()) {
        <div class="muted">Loading…</div>
      } @else if (items().length === 0) {
        <div class="muted">No tags yet.</div>
      } @else {
        <div class="grid">
          @for (t of items(); track t.name) {
            <button class="pill" type="button" (click)="addTagToFilter(t.name)">
              <span class="name">{{ t.name }}</span>
              <span class="count">{{ t.count }}</span>
            </button>
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
      display: grid;
      gap: 14px;
    }
    .pageHeader {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    h1 {
      margin: 0;
      font-size: 24px;
      letter-spacing: -0.02em;
    }
    .card {
      padding: 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.10);
      display: grid;
      gap: 10px;
    }
    .field {
      display: grid;
      gap: 6px;
    }
    .label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }
    .textInput {
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.92);
      padding: 10px 10px;
      outline: none;
      font-size: 14px;
    }
    .muted {
      color: rgba(255, 255, 255, 0.7);
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
    .button.secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
    }
    .errorBox {
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(255, 80, 80, 0.14);
      border: 1px solid rgba(255, 80, 80, 0.25);
      color: rgba(255, 220, 220, 0.92);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 10px;
    }
    .pill {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.92);
      cursor: pointer;
    }
    .pill:hover {
      background: rgba(255, 255, 255, 0.10);
    }
    .name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .count {
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagsPage {
  private readonly api = inject(VestigiumApiService);
  private readonly store = inject(EntriesStore);
  private readonly router = inject(Router);

  readonly prefix = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<TagSuggestionResponse[]>([]);

  private timer: any = null;

  constructor() {
    this.load('');
  }

  onPrefix(v: string) {
    this.prefix.set(v);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.load(this.prefix()), 200);
  }

  load(prefix: string) {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .suggestTags(prefix.trim().toLowerCase(), 500)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.items.set(items),
        error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to load tags')
      });
  }

  addTagToFilter(tag: string) {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    const next = Array.from(new Set([...this.store.tagFilter(), t]));
    this.store.setTagFilter(next);
    void this.router.navigate(['/entries'], { queryParams: { tags: next } });
  }
}


