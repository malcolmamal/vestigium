import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { VestigiumApiService } from './vestigium-api.service';
import { Api } from '../../../api/api';
import * as apiFn from '../../../api/functions';

// Mock the generated API functions
jest.mock('../../../api/functions', () => ({
  bulkCreate: jest.fn(),
  list: jest.fn(),
  get: jest.fn(),
  patch: jest.fn(),
  markVisited: jest.fn(),
  enqueueEnrich: jest.fn(),
  enqueueThumbnail: jest.fn(),
  list1: jest.fn(), // jobs list
  cancel: jest.fn(),
  delete1: jest.fn(), // delete job
  delete$: jest.fn(), // delete entry
  exportEntries: jest.fn(),
  importEntries: jest.fn(),
  listAll: jest.fn(),
  create: jest.fn(),
  delete2: jest.fn(), // delete list
  lists: jest.fn(),
  replaceLists: jest.fn(),
  search: jest.fn(),
  suggest: jest.fn(),
  random: jest.fn(),
  llm: jest.fn()
}));

describe('VestigiumApiService', () => {
  let service: VestigiumApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VestigiumApiService, Api, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(VestigiumApiService);
    jest.clearAllMocks();
  });

  // Helper to mock API response
  const mockApiResponse = (body: any) =>
    of({
      body,
      headers: {},
      status: 200,
      statusText: 'OK',
      url: ''
    });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list entries with filters', (done) => {
    const params = { q: 'test', tags: ['tag1'], page: 0, pageSize: 20 };
    const mockResponse = { items: [], page: 0, pageSize: 20 };
    (apiFn.list as unknown as jest.Mock).mockReturnValue(mockApiResponse(mockResponse));

    service.listEntries(params).subscribe((response) => {
      expect(response).toEqual(mockResponse);
      expect(apiFn.list).toHaveBeenCalledWith(
        expect.any(Object), // HttpClient
        expect.any(String), // rootUrl
        expect.objectContaining({
          q: 'test',
          tags: ['tag1']
        })
      );
      done();
    });
  });

  it('should get entry by id', (done) => {
    const mockEntry = { entry: { id: '123' }, attachments: [] };
    (apiFn.get as unknown as jest.Mock).mockReturnValue(mockApiResponse(mockEntry));

    service.getEntry('123').subscribe((response) => {
      expect(response).toEqual(mockEntry);
      expect(apiFn.get).toHaveBeenCalledWith(expect.any(Object), expect.any(String), { id: '123' });
      done();
    });
  });

  it('should patch entry', (done) => {
    const patch = { title: 'New Title', important: true };
    const mockEntry = { id: '123', title: 'New Title' };
    (apiFn.patch as unknown as jest.Mock).mockReturnValue(mockApiResponse(mockEntry));

    service.patchEntry('123', patch).subscribe((response) => {
      expect(response).toEqual(mockEntry);
      expect(apiFn.patch).toHaveBeenCalledWith(expect.any(Object), expect.any(String), {
        id: '123',
        body: patch
      });
      done();
    });
  });

  it('should delete entry', (done) => {
    (apiFn.delete$ as unknown as jest.Mock).mockReturnValue(mockApiResponse(null));

    service.deleteEntry('123').subscribe(() => {
      expect(apiFn.delete$).toHaveBeenCalledWith(expect.any(Object), expect.any(String), {
        id: '123'
      });
      done();
    });
  });

  it('should bulk create entries', (done) => {
    const urls = ['http://example.com'];
    const mockRes = { createdCount: 1, skippedCount: 0, errors: [] };
    (apiFn.bulkCreate as unknown as jest.Mock).mockReturnValue(mockApiResponse(mockRes));

    service.bulkCreateEntries(urls).subscribe((response) => {
      expect(response).toEqual(mockRes);
      expect(apiFn.bulkCreate).toHaveBeenCalledWith(expect.any(Object), expect.any(String), {
        body: { urls }
      });
      done();
    });
  });

  it('should search tags', (done) => {
    const mockTags = ['apple', 'appricot'];
    (apiFn.search as unknown as jest.Mock).mockReturnValue(mockApiResponse(mockTags));

    service.searchTags('app', 10).subscribe((response) => {
      expect(response).toEqual(mockTags);
      expect(apiFn.search).toHaveBeenCalledWith(expect.any(Object), expect.any(String), {
        prefix: 'app',
        limit: 10
      });
      done();
    });
  });
});
