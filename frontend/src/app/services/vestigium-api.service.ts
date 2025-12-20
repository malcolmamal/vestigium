import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import type { EntryDetailsResponse, EntryListResponse, PatchEntryRequest } from '../models/entry.model';
import type { JobResponse } from '../models/job.model';

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

  searchTags(prefix: string, limit = 20) {
    const params = new HttpParams().set('prefix', prefix).set('limit', String(limit));
    return this.http.get<string[]>('/api/tags', { params });
  }
}


