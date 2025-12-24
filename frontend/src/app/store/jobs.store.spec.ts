import { TestBed } from '@angular/core/testing';
import { JobsStore } from './jobs.store';
import { VestigiumApiService } from '../services/vestigium-api.service';
import { WebSocketService } from '../services/websocket.service';
import { of, Subject } from 'rxjs';
import { JobResponse } from '../models';

describe('JobsStore', () => {
  let store: JobsStore;
  let apiMock: any;
  let wsMock: any;
  let wsSubject: Subject<any>;

  const mockJob: JobResponse = {
    id: '1',
    type: 'ENRICH_ENTRY',
    status: 'PENDING',
    entryId: 'entry-1',
    createdAt: '2023-01-01T00:00:00Z'
  };

  beforeEach(() => {
    wsSubject = new Subject();
    apiMock = {
      listJobs: jest.fn().mockReturnValue(of([mockJob]))
    };
    wsMock = {
      watch: jest.fn().mockReturnValue(wsSubject.asObservable())
    };

    TestBed.configureTestingModule({
      providers: [
        JobsStore,
        { provide: VestigiumApiService, useValue: apiMock },
        { provide: WebSocketService, useValue: wsMock }
      ]
    });

    store = TestBed.inject(JobsStore);
  });

  it('should load initial jobs on creation', () => {
    expect(apiMock.listJobs).toHaveBeenCalledWith({
      status: ['PENDING', 'RUNNING', 'FAILED'],
      limit: 100
    });
    expect(store.items()).toEqual([mockJob]);
  });

  it('should update job when websocket message received', () => {
    const updatedJob = { ...mockJob, status: 'RUNNING' };
    wsSubject.next({ body: JSON.stringify(updatedJob) });

    expect(store.items()[0].status).toBe('RUNNING');
  });

  it('should add new job when websocket message received for unknown job', () => {
    const newJob: JobResponse = {
      id: '2',
      type: 'REGENERATE_THUMBNAIL',
      status: 'PENDING',
      entryId: 'entry-2',
      createdAt: '2023-01-01T00:01:00Z'
    };
    wsSubject.next({ body: JSON.stringify(newJob) });

    expect(store.items().length).toBe(2);
    expect(store.items()[0].id).toBe('2');
  });
});
