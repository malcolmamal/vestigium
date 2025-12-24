import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { EntryCardComponent } from './entry-card.component';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';
import type { EntryResponse, JobResponse } from '../../models';

describe('EntryCardComponent', () => {
  let component: EntryCardComponent;
  let fixture: ComponentFixture<EntryCardComponent>;
  let apiService: jest.Mocked<VestigiumApiService>;
  let entriesStore: jest.Mocked<EntriesStore>;

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

    const storeMock = {
      refresh: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [EntryCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: VestigiumApiService, useValue: apiMock },
        { provide: EntriesStore, useValue: storeMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EntryCardComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(VestigiumApiService) as jest.Mocked<VestigiumApiService>;
    entriesStore = TestBed.inject(EntriesStore) as jest.Mocked<EntriesStore>;

    // Set required input
    fixture.componentRef.setInput('entry', mockEntry);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load jobs on init', () => {
    expect(apiService.listJobs).toHaveBeenCalledWith({
      entryId: '1',
      status: ['PENDING', 'RUNNING']
    });
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

  it('should refresh thumbnail when thumb jobs complete', () => {
    const initialVersion = component.thumbVersion();
    
    // Simulate jobs with thumbnail job
    const jobs: JobResponse[] = [
      { id: '1', type: 'REGENERATE_THUMBNAIL', status: 'RUNNING', entryId: '1', attempts: 0, createdAt: '2023-01-01' }
    ];
    apiService.listJobs.mockReturnValue(of(jobs));
    
    // Trigger job load
    component['loadJobs']('1');
    
    // Now simulate job completion
    apiService.listJobs.mockReturnValue(of([]));
    component['loadJobs']('1');
    
    // Thumbnail version should have changed
    expect(component.thumbVersion()).not.toBe(initialVersion);
  });

  it('should compute busy state correctly', () => {
    expect(component.busy()).toBe(false);
    
    component.busyAction.set('enrich');
    expect(component.busy()).toBe(true);
    
    component.busyAction.set(null);
    expect(component.busy()).toBe(false);
  });
});


