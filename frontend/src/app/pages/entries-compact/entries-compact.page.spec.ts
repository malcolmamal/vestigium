import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import type { EntryResponse } from '../../models';
import { EntriesCompactPage } from './entries-compact.page';

describe('EntriesCompactPage', () => {
  let component: EntriesCompactPage;
  let fixture: ComponentFixture<EntriesCompactPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntriesCompactPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(EntriesCompactPage);
    component = fixture.componentInstance;

    // Avoid the constructor effect from firing real network calls.
    jest
      .spyOn(component as unknown as { loadAll: () => Promise<void> }, 'loadAll')
      .mockResolvedValue(undefined);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build 6 columns: top 5 sites + Other', () => {
    const make = (id: string, url: string): EntryResponse => ({
      id,
      url,
      title: id,
      thumbnailUrl: 'http://thumb'
    });

    // Dominance counts:
    // youtube 6, reddit 5, github 4, x 3, example.com 2, other.com 1 => top 5 + other
    const items: EntryResponse[] = [
      ...Array.from({ length: 6 }, (_, i) => make(`y${i}`, 'https://www.youtube.com/watch?v=abc')),
      ...Array.from({ length: 5 }, (_, i) => make(`r${i}`, 'https://www.reddit.com/r/test')),
      ...Array.from({ length: 4 }, (_, i) => make(`g${i}`, 'https://github.com/foo/bar')),
      ...Array.from({ length: 3 }, (_, i) => make(`x${i}`, 'https://x.com/user/status/1')),
      ...Array.from({ length: 2 }, (_, i) => make(`e${i}`, 'https://example.com/post')),
      make('o0', 'https://other.com/a')
    ];

    component.items.set(items);

    const cols = component.columns();
    expect(cols).toHaveLength(6);

    // Columns are sorted by count desc for the top 5
    expect(cols[0].key).toBe('youtube');
    expect(cols[1].key).toBe('reddit');
    expect(cols[2].key).toBe('github');
    expect(cols[3].key).toBe('x');
    expect(cols[4].key).toBe('example.com');
    expect(cols[5].key).toBe('other');

    expect(cols[0].count).toBe(6);
    expect(cols[1].count).toBe(5);
    expect(cols[2].count).toBe(4);
    expect(cols[3].count).toBe(3);
    expect(cols[4].count).toBe(2);
    expect(cols[5].count).toBe(1);

    // Ensure the "Other" column contains the non-top site
    expect(cols[5].items.map((e) => e.id)).toEqual(['o0']);
  });

  it('should generate a favicon url from entry hostname', () => {
    const e: EntryResponse = { id: '1', url: 'https://www.reddit.com/r/test' };
    expect(component.faviconUrl(e)).toContain('domain=reddit.com');
  });
});
