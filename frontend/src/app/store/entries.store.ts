import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';

import type { EntryResponse } from '../models/entry.model';
import { VestigiumApiService } from '../services/vestigium-api.service';

@Injectable({ providedIn: 'root' })
export class EntriesStore {
  private readonly api = inject(VestigiumApiService);

  readonly query = signal('');
  readonly tagFilter = signal<string[]>([]);
  readonly importantOnly = signal<boolean | null>(null);
  readonly visitedOnly = signal<boolean | null>(null);
  readonly addedFrom = signal<string | null>(null); // yyyy-mm-dd
  readonly addedTo = signal<string | null>(null); // yyyy-mm-dd
  readonly sort = signal<'updated_desc' | 'updated_asc' | 'added_desc' | 'added_asc'>('updated_desc');

  readonly page = signal(0);
  readonly pageSize = signal(25);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<EntryResponse[]>([]);
  readonly refreshToken = signal(0);

  readonly hasFilters = computed(() => {
    return (
      this.query().trim().length > 0 ||
      this.tagFilter().length > 0 ||
      this.importantOnly() !== null ||
      this.visitedOnly() !== null
    );
  });

  constructor() {
    effect(
      () => {
        // Re-load when filters change (simple v1 approach).
        void this.query();
        void this.tagFilter();
        void this.importantOnly();
        void this.visitedOnly();
        void this.addedFrom();
        void this.addedTo();
        void this.sort();
        void this.page();
        void this.pageSize();
        void this.refreshToken();

        this.load();
      },
      { allowSignalWrites: true }
    );
  }

  private toIsoStartOfDay(dateYmd: string | null) {
    if (!dateYmd) return undefined;
    // Use UTC to match backend's Instant.toString() (Z)
    return `${dateYmd}T00:00:00.000Z`;
  }

  private toIsoEndOfDay(dateYmd: string | null) {
    if (!dateYmd) return undefined;
    return `${dateYmd}T23:59:59.999Z`;
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .listEntries({
        q: this.query().trim() || undefined,
        tags: this.tagFilter(),
        important: this.importantOnly() ?? undefined,
        visited: this.visitedOnly() ?? undefined,
        addedFrom: this.toIsoStartOfDay(this.addedFrom()),
        addedTo: this.toIsoEndOfDay(this.addedTo()),
        sort: this.sort(),
        page: this.page(),
        pageSize: this.pageSize()
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => this.items.set(res.items),
        error: (e) => this.error.set(e?.message ?? 'Failed to load entries')
      });
  }

  setTagFilter(tags: string[]) {
    this.tagFilter.set([...tags]);
    this.page.set(0);
  }

  refresh() {
    this.refreshToken.update((x) => x + 1);
  }
}


