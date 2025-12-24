import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EntriesStore } from './entries.store';
import { VestigiumApiService } from '../services/vestigium-api.service';
import { SettingsStore } from './settings.store';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('EntriesStore', () => {
  let store: EntriesStore;
  let apiSpy: jest.Mocked<VestigiumApiService>;

  const mockEntry = {
    id: '1',
    url: 'http://example.com',
    title: 'Test Entry',
    tags: [],
    important: false,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    thumbnailUrl: '',
    thumbnailLargeUrl: ''
  };

  beforeEach(() => {
    const apiMock = {
      listEntries: jest.fn().mockReturnValue(of({ items: [mockEntry], page: 0, pageSize: 20 }))
    };

    const settingsMock = {
      showNsfw: jest.fn().mockReturnValue(false)
    };

    TestBed.configureTestingModule({
      providers: [
        EntriesStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: VestigiumApiService, useValue: apiMock },
        { provide: SettingsStore, useValue: settingsMock }
      ]
    });

    store = TestBed.inject(EntriesStore);
    apiSpy = TestBed.inject(VestigiumApiService) as jest.Mocked<VestigiumApiService>;
  });

  it('should load entries on init', fakeAsync(() => {
    TestBed.flushEffects();
    tick();

    expect(apiSpy.listEntries).toHaveBeenCalled();
    expect(store.items().length).toBe(1);
    expect(store.items()[0].title).toBe('Test Entry');
    expect(store.loading()).toBe(false);
  }));

  it('should handle load error', fakeAsync(() => {
    apiSpy.listEntries.mockReturnValue(throwError(() => new Error('API Error')));

    // Trigger reload
    store.refresh();
    TestBed.flushEffects();
    tick();

    expect(store.error()).toBe('API Error');
    expect(store.loading()).toBe(false);
  }));

  it('should reload when filters change', fakeAsync(() => {
    TestBed.flushEffects();
    tick(); // Initial load
    apiSpy.listEntries.mockClear();

    store.setTagFilter(['new-tag']);
    TestBed.flushEffects();
    tick();

    expect(apiSpy.listEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ['new-tag']
      })
    );
    expect(store.page()).toBe(0); // Should reset page
  }));

  it('should reload when refresh() is called', fakeAsync(() => {
    TestBed.flushEffects();
    tick(); // Initial load
    apiSpy.listEntries.mockClear();

    store.refresh();
    TestBed.flushEffects();
    tick();

    expect(apiSpy.listEntries).toHaveBeenCalled();
  }));

  it('should update specific item locally', () => {
    store.patchState({ items: [mockEntry] });
    store.updateItem('1', { title: 'Updated Title' });
    expect(store.items()[0].title).toBe('Updated Title');
  });

  it('should remove specific item locally', () => {
    store.patchState({ items: [mockEntry] });
    store.removeItem('1');
    expect(store.items().length).toBe(0);
  });
});
