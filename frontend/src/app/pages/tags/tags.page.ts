import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import type { TagSuggestionResponse } from '../../models';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';

@Component({
  selector: 'app-tags-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './tags.page.html',
  styleUrl: './tags.page.scss',
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
