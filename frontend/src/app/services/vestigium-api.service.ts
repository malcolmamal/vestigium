import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import type { EntryDetailsResponse, EntryListResponse, PatchEntryRequest } from '../models/entry.model';

@Injectable({ providedIn: 'root' })
export class VestigiumApiService {
  private readonly http = inject(HttpClient);

  createEntry(formData: FormData) {
    return this.http.post<EntryDetailsResponse>('/api/entries', formData);
  }

  listEntries(params: {
    q?: string;
    tags?: string[];
    important?: boolean;
    visited?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    let httpParams = new HttpParams();
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.tags && params.tags.length > 0) {
      for (const tag of params.tags) httpParams = httpParams.append('tags', tag);
    }
    if (params.important !== undefined) httpParams = httpParams.set('important', String(params.important));
    if (params.visited !== undefined) httpParams = httpParams.set('visited', String(params.visited));
    httpParams = httpParams.set('page', String(params.page ?? 0));
    httpParams = httpParams.set('pageSize', String(params.pageSize ?? 25));

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

  searchTags(prefix: string, limit = 20) {
    const params = new HttpParams().set('prefix', prefix).set('limit', String(limit));
    return this.http.get<string[]>('/api/tags', { params });
  }
}


