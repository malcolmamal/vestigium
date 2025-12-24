import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { EntryCardComponent } from './entry-card.component';
import type { EntryResponse, JobResponse } from '../../models';

describe('EntryCardComponent', () => {
  let component: EntryCardComponent;
  let fixture: ComponentFixture<EntryCardComponent>;

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
    await TestBed.configureTestingModule({
      imports: [EntryCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EntryCardComponent);
    component = fixture.componentInstance;

    // Set required input
    fixture.componentRef.setInput('entry', mockEntry);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter jobs for this entry from activeJobs input', () => {
    const job1: JobResponse = { id: 'j1', entryId: '1', status: 'PENDING', type: 'ENRICH_ENTRY', createdAt: '' };
    const job2: JobResponse = { id: 'j2', entryId: '2', status: 'PENDING', type: 'ENRICH_ENTRY', createdAt: '' };
    
    fixture.componentRef.setInput('activeJobs', [job1, job2]);
    fixture.detectChanges();

    expect(component.jobs()).toEqual([job1]);
    expect(component.enrichJobs()).toEqual([job1]);
  });

  it('should refresh thumbnail version when thumb job disappears', () => {
    const initialVersion = component.thumbVersion();
    const thumbJob: JobResponse = { id: 'j1', entryId: '1', status: 'RUNNING', type: 'REGENERATE_THUMBNAIL', createdAt: '' };
    
    // Set active job
    fixture.componentRef.setInput('activeJobs', [thumbJob]);
    fixture.detectChanges();
    
    // Job completes (disappears from input)
    fixture.componentRef.setInput('activeJobs', []);
    fixture.detectChanges();

    expect(component.thumbVersion()).toBeGreaterThan(initialVersion);
  });

  it('should emit enrich output', () => {
    const spy = jest.spyOn(component.enrich, 'emit');
    component.enqueueEnrich(new MouseEvent('click'));
    expect(spy).toHaveBeenCalledWith('1');
  });

  it('should emit regenerateThumbnail output', () => {
    const spy = jest.spyOn(component.regenerateThumbnail, 'emit');
    component.enqueueThumbnail(new MouseEvent('click'));
    expect(spy).toHaveBeenCalledWith('1');
  });

  it('should emit toggleImportant output', () => {
    const spy = jest.spyOn(component.toggleImportant, 'emit');
    component.onToggleImportant(new MouseEvent('click'));
    expect(spy).toHaveBeenCalledWith('1');
  });

  it('should emit delete output after confirmation', () => {
    window.confirm = jest.fn(() => true);
    const spy = jest.spyOn(component.delete, 'emit');
    component.onDelete(new MouseEvent('click'));
    expect(spy).toHaveBeenCalledWith('1');
  });

  it('should not emit delete output if user cancels', () => {
    window.confirm = jest.fn(() => false);
    const spy = jest.spyOn(component.delete, 'emit');
    component.onDelete(new MouseEvent('click'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('should compute busy state based on busyAction input', () => {
    expect(component.busy()).toBe(false);
    
    fixture.componentRef.setInput('busyAction', 'enrich');
    fixture.detectChanges();
    expect(component.busy()).toBe(true);
    
    fixture.componentRef.setInput('busyAction', null);
    fixture.detectChanges();
    expect(component.busy()).toBe(false);
  });
});
