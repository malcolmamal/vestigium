import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';

import type { EntryResponse } from '../models/entry.model';
import { VestigiumApiService } from '../services/vestigium-api.service';
import { SettingsStore } from './settings.store';

@Injectable({ providedIn: 'root' })
export class EntriesStore {
  private readonly api = inject(VestigiumApiService);
  private readonly settings = inject(SettingsStore);

  readonly query = signal('');
  readonly tagFilter = signal<string[]>([]);
  readonly listFilter = signal<string[]>([]); // list ids
  readonly importantOnly = signal<boolean | null>(null);
  readonly visitedOnly = signal<boolean | null>(null);
  readonly addedFrom = signal<string | null>(null); // yyyy-mm-dd
  readonly addedTo = signal<string | null>(null); // yyyy-mm-dd
  readonly sort = signal<'updated_desc' | 'updated_asc' | 'added_desc' | 'added_asc'>('added_desc');

  readonly page = signal(0);
  readonly pageSize = signal(20);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<EntryResponse[]>([]);
  readonly refreshToken = signal(0);

  readonly hasFilters = computed(() => {
    return (
      this.query().trim().length > 0 ||
      this.tagFilter().length > 0 ||
      this.listFilter().length > 0 ||
      this.importantOnly() !== null ||
      this.visitedOnly() !== null ||
      this.addedFrom() !== null ||
      this.addedTo() !== null ||
      this.sort() !== 'added_desc'
    );
  });

  constructor() {
    effect(() => {
      // Re-load when filters change (simple v1 approach).
      void this.query();
      void this.tagFilter();
      void this.listFilter();
      void this.importantOnly();
      void this.visitedOnly();
      void this.addedFrom();
      void this.addedTo();
      void this.sort();
      void this.page();
      void this.pageSize();
      void this.refreshToken();
      void this.settings.showNsfw();

      this.load();
    });
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
    // Only show full loading state if we have no items (initial load)
    if (this.items().length === 0) {
      this.loading.set(true);
    }
    this.error.set(null);

    this.api
      .listEntries({
        q: this.query().trim() || undefined,
        tags: this.tagFilter(),
        listIds: this.listFilter(),
        important: this.importantOnly() ?? undefined,
        visited: this.visitedOnly() ?? undefined,
        includeNsfw: this.settings.showNsfw(),
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

  setListFilter(listIds: string[]) {
    this.listFilter.set([...listIds]);
    this.page.set(0);
  }

  refresh() {
    this.refreshToken.update((x) => x + 1);
  }
}


