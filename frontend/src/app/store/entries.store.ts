import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';

import type { EntryResponse } from '../models';
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

  private readonly filterState = computed(() => ({
    query: this.query(),
    tags: this.tagFilter(),
    listIds: this.listFilter(),
    important: this.importantOnly(),
    visited: this.visitedOnly(),
    addedFrom: this.addedFrom(),
    addedTo: this.addedTo(),
    sort: this.sort(),
    page: this.page(),
    pageSize: this.pageSize(),
    nsfw: this.settings.showNsfw(),
    refresh: this.refreshToken()
  }));

  constructor() {
    toObservable(this.filterState).pipe(
      tap(() => {
        if (this.items().length === 0) {
          this.loading.set(true);
        }
        this.error.set(null);
      }),
      switchMap(state => {
        return this.api.listEntries({
          q: state.query.trim() || undefined,
          tags: state.tags,
          listIds: state.listIds,
          important: state.important ?? undefined,
          visited: state.visited ?? undefined,
          includeNsfw: state.nsfw,
          addedFrom: this.toIsoStartOfDay(state.addedFrom),
          addedTo: this.toIsoEndOfDay(state.addedTo),
          sort: state.sort,
          page: state.page,
          pageSize: state.pageSize
        }).pipe(
          catchError(err => {
            this.error.set(err?.message ?? 'Failed to load entries');
            return of({ items: [] });
          }),
          finalize(() => this.loading.set(false))
        );
      })
    ).subscribe(res => {
      if (res.items) {
        this.items.set(res.items);
      }
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


