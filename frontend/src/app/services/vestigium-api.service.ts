import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import type { EntryDetailsResponse, EntryListResponse, PatchEntryRequest } from '../models/entry.model';
import type { JobResponse } from '../models/job.model';
import type { EntryExportItem, ImportEntriesResponse } from '../models/import-export.model';
import type { ListResponse } from '../models/list.model';
import type { TagSuggestionResponse } from '../models/tag-suggestion.model';

@Injectable({ providedIn: 'root' })
export class VestigiumApiService {
  private readonly http = inject(HttpClient);

  createEntry(formData: FormData) {
    return this.http.post<EntryDetailsResponse>('/api/entries', formData);
  }

  bulkCreateEntries(urls: string[]) {
    return this.http.post<{ createdCount: number; skippedCount: number; errors: { url: string; error: string }[] }>(
      '/api/entries/bulk',
      { urls }
    );
  }

  listEntries(params: {
    q?: string;
    tags?: string[];
    listIds?: string[];
    important?: boolean;
    visited?: boolean;
    addedFrom?: string;
    addedTo?: string;
    sort?: 'added_desc' | 'added_asc' | 'updated_desc' | 'updated_asc';
    page?: number;
    pageSize?: number;
  }) {
    let httpParams = new HttpParams();
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.tags && params.tags.length > 0) {
      for (const tag of params.tags) httpParams = httpParams.append('tags', tag);
    }
    if (params.listIds && params.listIds.length > 0) {
      for (const id of params.listIds) httpParams = httpParams.append('listId', id);
    }
    if (params.important !== undefined) httpParams = httpParams.set('important', String(params.important));
    if (params.visited !== undefined) httpParams = httpParams.set('visited', String(params.visited));
    if (params.addedFrom) httpParams = httpParams.set('addedFrom', params.addedFrom);
    if (params.addedTo) httpParams = httpParams.set('addedTo', params.addedTo);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    httpParams = httpParams.set('page', String(params.page ?? 0));
    httpParams = httpParams.set('pageSize', String(params.pageSize ?? 20));

    return this.http.get<EntryListResponse>('/api/entries', { params: httpParams });
  }

  getEntry(id: string) {
    return this.http.get<EntryDetailsResponse>(`/api/entries/${encodeURIComponent(id)}`);
  }

  patchEntry(id: string, patch: PatchEntryRequest) {
    return this.http.patch(`/api/entries/${encodeURIComponent(id)}`, patch);
  }

  markVisited(id: string) {
    return this.http.post<void>(`/api/entries/${encodeURIComponent(id)}/visited`, {});
  }

  enqueueEnrich(id: string) {
    return this.http.post<void>(`/api/entries/${encodeURIComponent(id)}/enqueue-enrich`, {});
  }

  enqueueThumbnail(id: string) {
    return this.http.post<void>(`/api/entries/${encodeURIComponent(id)}/enqueue-thumbnail`, {});
  }

  listJobs(params: { entryId?: string; status?: string[]; limit?: number }) {
    let httpParams = new HttpParams();
    if (params.entryId) httpParams = httpParams.set('entryId', params.entryId);
    if (params.status && params.status.length > 0) {
      for (const s of params.status) httpParams = httpParams.append('status', s);
    }
    if (params.limit !== undefined) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<JobResponse[]>('/api/jobs', { params: httpParams });
  }

  cancelJob(id: string) {
    return this.http.post<void>(`/api/jobs/${encodeURIComponent(id)}/cancel`, {});
  }

  deleteJob(id: string) {
    return this.http.delete<void>(`/api/jobs/${encodeURIComponent(id)}`);
  }

  deleteEntry(id: string) {
    return this.http.delete<void>(`/api/entries/${encodeURIComponent(id)}`);
  }

  exportEntries() {
    return this.http.get<EntryExportItem[]>('/api/entries/export');
  }

  importEntries(mode: 'skip' | 'update', items: EntryExportItem[]) {
    return this.http.post<ImportEntriesResponse>('/api/entries/import', { mode, items });
  }

  listLists() {
    return this.http.get<ListResponse[]>('/api/lists');
  }

  createList(name: string) {
    return this.http.post<ListResponse>('/api/lists', { name });
  }

  deleteList(id: string, force = false) {
    const params = new HttpParams().set('force', String(force));
    return this.http.delete<void>(`/api/lists/${encodeURIComponent(id)}`, { params });
  }

  getEntryLists(entryId: string) {
    return this.http.get<ListResponse[]>(`/api/entries/${encodeURIComponent(entryId)}/lists`);
  }

  setEntryLists(entryId: string, listIds: string[]) {
    return this.http.post<void>(`/api/entries/${encodeURIComponent(entryId)}/lists`, { listIds });
  }

  searchTags(prefix: string, limit = 20) {
    const params = new HttpParams().set('prefix', prefix).set('limit', String(limit));
    return this.http.get<string[]>('/api/tags', { params });
  }

  suggestTags(prefix: string, limit = 20) {
    const params = new HttpParams().set('prefix', prefix).set('limit', String(limit));
    return this.http.get<TagSuggestionResponse[]>('/api/tags/suggest', { params });
  }
}


