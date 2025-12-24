import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';

import type { EntryResponse } from '../models';
import { VestigiumApiService } from '../services/vestigium-api.service';
import { SettingsStore } from './settings.store';

export interface EntriesFilter {
  query: string;
  tagFilter: string[];
  listFilter: string[];
  importantOnly: boolean | null;
  visitedOnly: boolean | null;
  addedFrom: string | null;
  addedTo: string | null;
  sort: 'updated_desc' | 'updated_asc' | 'added_desc' | 'added_asc';
  page: number;
  pageSize: number;
  refreshToken: number;
}

export interface EntriesResult {
  loading: boolean;
  error: string | null;
  items: EntryResponse[];
}

// Combined type for the public patchState API
export type EntriesState = EntriesFilter & EntriesResult;

@Injectable({ providedIn: 'root' })
export class EntriesStore {
  private readonly api = inject(VestigiumApiService);
  private readonly settings = inject(SettingsStore);

  // Split signals to break circular dependency:
  // Updates to results (loading, items) will NOT trigger the filters computed.
  private readonly filters = signal<EntriesFilter>({
    query: '',
    tagFilter: [],
    listFilter: [],
    importantOnly: null,
    visitedOnly: null,
    addedFrom: null,
    addedTo: null,
    sort: 'added_desc',
    page: 0,
    pageSize: 20,
    refreshToken: 0
  });

  private readonly results = signal<EntriesResult>({
    loading: false,
    error: null,
    items: []
  });

  // Selectors - Filters
  readonly query = computed(() => this.filters().query);
  readonly tagFilter = computed(() => this.filters().tagFilter);
  readonly listFilter = computed(() => this.filters().listFilter);
  readonly importantOnly = computed(() => this.filters().importantOnly);
  readonly visitedOnly = computed(() => this.filters().visitedOnly);
  readonly addedFrom = computed(() => this.filters().addedFrom);
  readonly addedTo = computed(() => this.filters().addedTo);
  readonly sort = computed(() => this.filters().sort);
  readonly page = computed(() => this.filters().page);
  readonly pageSize = computed(() => this.filters().pageSize);
  readonly refreshToken = computed(() => this.filters().refreshToken);

  // Selectors - Results
  readonly loading = computed(() => this.results().loading);
  readonly error = computed(() => this.results().error);
  readonly items = computed(() => this.results().items);

  readonly hasFilters = computed(() => {
    const f = this.filters();
    return (
      f.query.trim().length > 0 ||
      f.tagFilter.length > 0 ||
      f.listFilter.length > 0 ||
      f.importantOnly !== null ||
      f.visitedOnly !== null ||
      f.addedFrom !== null ||
      f.addedTo !== null ||
      f.sort !== 'added_desc'
    );
  });

  /**
   * This computed defines what triggers a reload.
   * It only depends on the filters signal and settings.
   */
  private readonly filterState = computed(() => {
    const f = this.filters();
    return {
      ...f,
      nsfw: this.settings.showNsfw()
    };
  });

  constructor() {
    toObservable(this.filterState).pipe(
      tap(() => {
        if (this.items().length === 0) {
          this.patchResults({ loading: true });
        }
        this.patchResults({ error: null });
      }),
      switchMap(state => {
        return this.api.listEntries({
          q: state.query.trim() || undefined,
          tags: state.tagFilter,
          listIds: state.listFilter,
          important: state.importantOnly ?? undefined,
          visited: state.visitedOnly ?? undefined,
          includeNsfw: state.nsfw,
          addedFrom: this.toIsoStartOfDay(state.addedFrom),
          addedTo: this.toIsoEndOfDay(state.addedTo),
          sort: state.sort,
          page: state.page,
          pageSize: state.pageSize
        }).pipe(
          catchError(err => {
            this.patchResults({ error: err?.message ?? 'Failed to load entries' });
            return of({ items: [] });
          }),
          finalize(() => this.patchResults({ loading: false }))
        );
      })
    ).subscribe(res => {
      if (res.items) {
        this.patchResults({ items: res.items });
      }
    });
  }

  private toIsoStartOfDay(dateYmd: string | null) {
    if (!dateYmd) return undefined;
    return `${dateYmd}T00:00:00.000Z`;
  }

  private toIsoEndOfDay(dateYmd: string | null) {
    if (!dateYmd) return undefined;
    return `${dateYmd}T23:59:59.999Z`;
  }

  /**
   * Main patch method that handles both filters and results.
   * This maintains compatibility with existing code and tests.
   */
  patchState(patch: Partial<EntriesState>) {
    // Extract filter keys
    const filterPatch: Partial<EntriesFilter> = {};
    const resultPatch: Partial<EntriesResult> = {};

    const filterKeys: (keyof EntriesFilter)[] = [
      'query', 'tagFilter', 'listFilter', 'importantOnly', 'visitedOnly', 
      'addedFrom', 'addedTo', 'sort', 'page', 'pageSize', 'refreshToken'
    ];

    for (const key of Object.keys(patch) as (keyof EntriesState)[]) {
      if (filterKeys.includes(key as any)) {
        (filterPatch as any)[key] = patch[key];
      } else {
        (resultPatch as any)[key] = patch[key];
      }
    }

    if (Object.keys(filterPatch).length > 0) {
      this.filters.update(f => ({ ...f, ...filterPatch }));
    }
    if (Object.keys(resultPatch).length > 0) {
      this.results.update(r => ({ ...r, ...resultPatch }));
    }
  }

  private patchResults(patch: Partial<EntriesResult>) {
    this.results.update(r => ({ ...r, ...patch }));
  }

  setQuery(query: string) {
    this.patchState({ query, page: 0 });
  }

  setTagFilter(tagFilter: string[]) {
    this.patchState({ tagFilter: [...tagFilter], page: 0 });
  }

  setListFilter(listFilter: string[]) {
    this.patchState({ listFilter: [...listFilter], page: 0 });
  }

  setImportantOnly(importantOnly: boolean | null) {
    this.patchState({ importantOnly, page: 0 });
  }

  setVisitedOnly(visitedOnly: boolean | null) {
    this.patchState({ visitedOnly, page: 0 });
  }

  setAddedFrom(addedFrom: string | null) {
    this.patchState({ addedFrom, page: 0 });
  }

  setAddedTo(addedTo: string | null) {
    this.patchState({ addedTo, page: 0 });
  }

  setSort(sort: EntriesFilter['sort']) {
    this.patchState({ sort, page: 0 });
  }

  setPage(page: number) {
    this.patchState({ page });
  }

  setPageSize(pageSize: number) {
    this.patchState({ pageSize, page: 0 });
  }

  refresh() {
    this.patchState({ refreshToken: this.filters().refreshToken + 1 });
  }

  updateItem(id: string, patch: Partial<EntryResponse>) {
    this.patchResults({
      items: this.results().items.map(item => item.id === id ? { ...item, ...patch } : item)
    });
  }

  removeItem(id: string) {
    this.patchResults({
      items: this.results().items.filter(item => item.id !== id)
    });
  }
}
