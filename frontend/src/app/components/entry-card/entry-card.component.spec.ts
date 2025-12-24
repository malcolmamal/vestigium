import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { EntryCardComponent } from './entry-card.component';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';
import { JobsStore } from '../../store/jobs.store';
import type { EntryResponse, JobResponse } from '../../models';

describe('EntryCardComponent', () => {
  let component: EntryCardComponent;
  let fixture: ComponentFixture<EntryCardComponent>;
  let apiService: jest.Mocked<VestigiumApiService>;
  let entriesStore: jest.Mocked<EntriesStore>;
  let jobsStore: any;

  const mockEntry: EntryResponse = {
    id: '1',
    url: 'http://example.com',
    title: 'Test Entry',
    description: 'Test Description',
    tags: ['tag1', 'tag2'],
    important: false,
    visitedAt: null,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    thumbnailUrl: '/api/entries/1/thumbnail',
    thumbnailLargeUrl: '/api/entries/1/thumbnail?size=large'
  };

  beforeEach(async () => {
    const apiMock = {
      listJobs: jest.fn().mockReturnValue(of([])),
      enqueueEnrich: jest.fn().mockReturnValue(of({})),
      enqueueThumbnail: jest.fn().mockReturnValue(of({})),
      patchEntry: jest.fn().mockReturnValue(of({})),
      deleteEntry: jest.fn().mockReturnValue(of({}))
    };

    const entriesStoreMock = {
      refresh: jest.fn()
    };

    const jobsStoreMock = {
      items: signal<JobResponse[]>([])
    };

    await TestBed.configureTestingModule({
      imports: [EntryCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: VestigiumApiService, useValue: apiMock },
        { provide: EntriesStore, useValue: entriesStoreMock },
        { provide: JobsStore, useValue: jobsStoreMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EntryCardComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(VestigiumApiService) as jest.Mocked<VestigiumApiService>;
    entriesStore = TestBed.inject(EntriesStore) as jest.Mocked<EntriesStore>;
    jobsStore = TestBed.inject(JobsStore);

    // Set required input
    fixture.componentRef.setInput('entry', mockEntry);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter jobs for this entry from store', () => {
    const job1: JobResponse = { id: 'j1', entryId: '1', status: 'PENDING', type: 'ENRICH_ENTRY', createdAt: '' };
    const job2: JobResponse = { id: 'j2', entryId: '2', status: 'PENDING', type: 'ENRICH_ENTRY', createdAt: '' };
    
    jobsStore.items.set([job1, job2]);
    fixture.detectChanges();

    expect(component.jobs()).toEqual([job1]);
    expect(component.enrichJobs()).toEqual([job1]);
  });

  it('should refresh thumbnail version when thumb job disappears', () => {
    const initialVersion = component.thumbVersion();
    const thumbJob: JobResponse = { id: 'j1', entryId: '1', status: 'RUNNING', type: 'REGENERATE_THUMBNAIL', createdAt: '' };
    
    // Set active job
    jobsStore.items.set([thumbJob]);
    fixture.detectChanges();
    
    // Job completes (disappears from store)
    jobsStore.items.set([]);
    fixture.detectChanges();

    expect(component.thumbVersion()).toBeGreaterThan(initialVersion);
  });

  it('should enqueue enrich job', () => {
    const changedSpy = jest.spyOn(component.changed, 'emit');
    
    component.enqueueEnrich(new MouseEvent('click'));

    expect(apiService.enqueueEnrich).toHaveBeenCalledWith('1');
    expect(entriesStore.refresh).toHaveBeenCalled();
    expect(changedSpy).toHaveBeenCalledWith({ kind: 'queued', entryId: '1' });
    expect(component.busyAction()).toBeNull();
  });

  it('should enqueue thumbnail job', () => {
    const changedSpy = jest.spyOn(component.changed, 'emit');
    
    component.enqueueThumbnail(new MouseEvent('click'));

    expect(apiService.enqueueThumbnail).toHaveBeenCalledWith('1');
    expect(entriesStore.refresh).toHaveBeenCalled();
    expect(changedSpy).toHaveBeenCalledWith({ kind: 'queued', entryId: '1' });
    expect(component.busyAction()).toBeNull();
  });

  it('should toggle important flag', () => {
    const changedSpy = jest.spyOn(component.changed, 'emit');
    
    component.toggleImportant(new MouseEvent('click'));

    expect(apiService.patchEntry).toHaveBeenCalledWith('1', { important: true });
    expect(entriesStore.refresh).toHaveBeenCalled();
    expect(changedSpy).toHaveBeenCalledWith({ kind: 'updated', entryId: '1' });
    expect(component.busyAction()).toBeNull();
  });

  it('should handle delete with confirmation', () => {
    window.confirm = jest.fn(() => true);
    const changedSpy = jest.spyOn(component.changed, 'emit');
    
    component.delete(new MouseEvent('click'));

    expect(apiService.deleteEntry).toHaveBeenCalledWith('1');
    expect(entriesStore.refresh).toHaveBeenCalled();
    expect(changedSpy).toHaveBeenCalledWith({ kind: 'deleted', entryId: '1' });
    expect(component.busyAction()).toBeNull();
  });

  it('should not delete if user cancels', () => {
    window.confirm = jest.fn(() => false);
    
    component.delete(new MouseEvent('click'));

    expect(apiService.deleteEntry).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', () => {
    apiService.enqueueEnrich.mockReturnValue(throwError(() => new Error('API Error')));
    
    component.enqueueEnrich(new MouseEvent('click'));

    expect(component.busyAction()).toBeNull();
  });

  it('should compute busy state correctly', () => {
    expect(component.busy()).toBe(false);
    
    component.busyAction.set('enrich');
    expect(component.busy()).toBe(true);
    
    component.busyAction.set(null);
    expect(component.busy()).toBe(false);
  });
});
