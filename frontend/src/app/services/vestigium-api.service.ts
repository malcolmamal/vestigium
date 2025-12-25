import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, Observable, of, switchMap } from 'rxjs';

import { Api } from '../../../api/api';
import * as apiFn from '../../../api/functions';
import { StrictHttpResponse } from '../../../api/strict-http-response';
import type { EntryDetailsResponse } from '../../../api/models/entry-details-response';
import type { EntryExportItem } from '../../../api/models/entry-export-item';
import type { LlmRecommendRequest } from '../../../api/models/llm-recommend-request';
import type { PatchEntryRequest } from '../../../api/models/patch-entry-request';

@Injectable({ providedIn: 'root' })
export class VestigiumApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(Api);

  createEntry(formData: FormData) {
    // FormData is not directly supported by the generated API, so we keep using HttpClient
    return this.http.post<EntryDetailsResponse>('/api/entries', formData);
  }

  bulkCreateEntries(urls: string[]) {
    return apiFn
      .bulkCreate(this.http, this.api.rootUrl, { body: { urls } })
      .pipe(switchMap(unwrapBody));
  }

  listEntries(params: {
    q?: string;
    tags?: string[];
    listIds?: string[];
    important?: boolean;
    visited?: boolean;
    includeNsfw?: boolean;
    addedFrom?: string;
    addedTo?: string;
    sort?: 'added_desc' | 'added_asc' | 'updated_desc' | 'updated_asc';
    page?: number;
    pageSize?: number;
  }) {
    return apiFn
      .list(this.http, this.api.rootUrl, {
        q: params.q,
        tags: params.tags,
        listId: params.listIds,
        important: params.important,
        visited: params.visited,
        includeNsfw: params.includeNsfw,
        addedFrom: params.addedFrom,
        addedTo: params.addedTo,
        sort: params.sort,
        page: params.page ?? 0,
        pageSize: params.pageSize ?? 20
      })
      .pipe(switchMap(unwrapBody));
  }

  getEntry(id: string) {
    return apiFn.get(this.http, this.api.rootUrl, { id }).pipe(switchMap(unwrapBody));
  }

  patchEntry(id: string, patch: PatchEntryRequest) {
    return apiFn
      .patch(this.http, this.api.rootUrl, { id, body: patch })
      .pipe(switchMap(unwrapBody));
  }

  markVisited(id: string) {
    return apiFn.markVisited(this.http, this.api.rootUrl, { id }).pipe(switchMap(unwrapBody));
  }

  enqueueEnrich(id: string) {
    return apiFn.enqueueEnrich(this.http, this.api.rootUrl, { id }).pipe(switchMap(unwrapBody));
  }

  enqueueThumbnail(id: string) {
    return apiFn.enqueueThumbnail(this.http, this.api.rootUrl, { id }).pipe(switchMap(unwrapBody));
  }

  listJobs(params: { entryId?: string; status?: string[]; limit?: number }) {
    return apiFn
      .list1(this.http, this.api.rootUrl, {
        entryId: params.entryId,
        status: params.status,
        limit: params.limit
      })
      .pipe(switchMap(unwrapBody));
  }

  cancelJob(id: string) {
    return apiFn.cancel(this.http, this.api.rootUrl, { id }).pipe(switchMap(unwrapBody));
  }

  retryJob(id: string) {
    return this.http.post<void>(`${this.api.rootUrl}/api/jobs/${id}/retry`, {});
  }

  deleteJob(id: string) {
    return apiFn.delete1(this.http, this.api.rootUrl, { id }).pipe(switchMap(unwrapBody));
  }

  deleteEntry(id: string) {
    return apiFn.delete$(this.http, this.api.rootUrl, { id }).pipe(switchMap(unwrapBody));
  }

  exportEntries() {
    return apiFn.exportEntries(this.http, this.api.rootUrl).pipe(switchMap(unwrapBody));
  }

  importEntries(mode: 'skip' | 'update', items: EntryExportItem[]) {
    return apiFn
      .importEntries(this.http, this.api.rootUrl, { body: { mode, items } })
      .pipe(switchMap(unwrapBody));
  }

  listLists() {
    return apiFn.listAll(this.http, this.api.rootUrl).pipe(switchMap(unwrapBody));
  }

  createList(name: string) {
    return apiFn
      .create(this.http, this.api.rootUrl, { body: { name } })
      .pipe(switchMap(unwrapBody));
  }

  deleteList(id: string, force = false) {
    return apiFn.delete2(this.http, this.api.rootUrl, { id, force }).pipe(switchMap(unwrapBody));
  }

  getEntryLists(entryId: string) {
    return apiFn.lists(this.http, this.api.rootUrl, { id: entryId }).pipe(switchMap(unwrapBody));
  }

  setEntryLists(entryId: string, listIds: string[]) {
    return apiFn
      .replaceLists(this.http, this.api.rootUrl, { id: entryId, body: { listIds } })
      .pipe(switchMap(unwrapBody));
  }

  searchTags(prefix: string, limit = 20) {
    return apiFn.search(this.http, this.api.rootUrl, { prefix, limit }).pipe(switchMap(unwrapBody));
  }

  suggestTags(prefix: string, limit = 20) {
    return apiFn
      .suggest(this.http, this.api.rootUrl, { prefix, limit })
      .pipe(switchMap(unwrapBody));
  }

  getRandomRecommendations(params: { limit?: number; includeNsfw?: boolean }) {
    return apiFn
      .random(this.http, this.api.rootUrl, {
        limit: params.limit ?? 20,
        includeNsfw: params.includeNsfw
      })
      .pipe(switchMap(unwrapBody));
  }

  getLlmRecommendations(body: LlmRecommendRequest) {
    return apiFn.llm(this.http, this.api.rootUrl, { body }).pipe(switchMap(unwrapBody));
  }
}

function unwrapBody<T>(r: StrictHttpResponse<T>): Observable<T> {
  if (r.body instanceof Blob) {
    return from(r.body.text().then((text) => (text ? JSON.parse(text) : null)));
  }
  return of(r.body);
}
