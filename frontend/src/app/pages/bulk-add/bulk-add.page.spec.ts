import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { BulkAddPage } from './bulk-add.page';

describe('BulkAddPage', () => {
  let component: BulkAddPage;
  let fixture: ComponentFixture<BulkAddPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkAddPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(BulkAddPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('parsedItems', () => {
    it('should parse Format 1: URL only', () => {
      component.raw.set('https://example.com/\nhttps://www.youtube.com/watch?v=abc');
      const items = component.parsedItems();
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({ url: 'https://example.com/', title: null });
      expect(items[1]).toEqual({ url: 'https://www.youtube.com/watch?v=abc', title: null });
    });

    it('should parse Format 2: Title then URL', () => {
      component.raw.set(
        'My Title\nhttps://example.com/\nAnother Title\nhttps://www.youtube.com/watch?v=abc'
      );
      const items = component.parsedItems();
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({ url: 'https://example.com/', title: 'My Title' });
      expect(items[1]).toEqual({
        url: 'https://www.youtube.com/watch?v=abc',
        title: 'Another Title'
      });
    });

    it('should parse Format 3: URL | Title', () => {
      component.raw.set(
        'https://example.com/ | My Title\nhttps://www.youtube.com/watch?v=abc | Another Title'
      );
      const items = component.parsedItems();
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({ url: 'https://example.com/', title: 'My Title' });
      expect(items[1]).toEqual({
        url: 'https://www.youtube.com/watch?v=abc',
        title: 'Another Title'
      });
    });

    it('should parse Format 3 with title containing pipe', () => {
      component.raw.set('https://example.com/ | Title with | multiple pipes');
      const items = component.parsedItems();
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual({
        url: 'https://example.com/',
        title: 'Title with | multiple pipes'
      });
    });

    it('should handle mixed formats', () => {
      component.raw.set(
        'https://example.com/\n' +
          'Title Line\n' +
          'https://example2.com/\n' +
          'https://example3.com/ | Pipe Title'
      );
      const items = component.parsedItems();
      expect(items).toHaveLength(3);
      expect(items[0]).toEqual({ url: 'https://example.com/', title: null });
      expect(items[1]).toEqual({ url: 'https://example2.com/', title: 'Title Line' });
      expect(items[2]).toEqual({ url: 'https://example3.com/', title: 'Pipe Title' });
    });

    it('should de-duplicate URLs preserving order', () => {
      component.raw.set(
        'https://example.com/ | First Title\n' +
          'https://example.com/ | Second Title\n' +
          'https://example.com/'
      );
      const items = component.parsedItems();
      expect(items).toHaveLength(1);
      // Should preserve first occurrence with title
      expect(items[0]).toEqual({ url: 'https://example.com/', title: 'First Title' });
    });

    it('should ignore empty lines', () => {
      component.raw.set('\n\nhttps://example.com/\n\n\nhttps://example2.com/ | Title\n\n');
      const items = component.parsedItems();
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({ url: 'https://example.com/', title: null });
      expect(items[1]).toEqual({ url: 'https://example2.com/', title: 'Title' });
    });

    it('should trim whitespace', () => {
      component.raw.set(
        '  https://example.com/  \n  https://example2.com/  |  Title with spaces  '
      );
      const items = component.parsedItems();
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({ url: 'https://example.com/', title: null });
      expect(items[1]).toEqual({ url: 'https://example2.com/', title: 'Title with spaces' });
    });

    it('should handle Format 3 with empty title', () => {
      component.raw.set('https://example.com/ | ');
      const items = component.parsedItems();
      expect(items).toHaveLength(1);
      // Empty string after trim becomes null
      expect(items[0]).toEqual({ url: 'https://example.com/', title: null });
    });

    it('should ignore lines without valid URLs', () => {
      component.raw.set('Not a URL\nAlso not a URL\nhttps://example.com/');
      const items = component.parsedItems();
      expect(items).toHaveLength(1);
      // "Not a URL" - not a URL, next line is not a URL, so ignored
      // "Also not a URL" - not a URL, but next line IS a URL, so Format 2 matches
      // Creates entry with URL and title "Also not a URL"
      expect(items[0]).toEqual({ url: 'https://example.com/', title: 'Also not a URL' });
    });

    it('should ignore Format 3 lines where URL part is not a valid URL', () => {
      component.raw.set('not-a-url | Some Title\nhttps://example.com/');
      const items = component.parsedItems();
      expect(items).toHaveLength(1);
      // "not-a-url | Some Title" doesn't start with http, so Format 3 check fails
      // It falls through to Format 2, where "not-a-url | Some Title" is treated as title for next line
      // But next line is a URL, so it becomes Format 2 entry
      expect(items[0]).toEqual({ url: 'https://example.com/', title: 'not-a-url | Some Title' });
    });

    it('should handle real-world example format', () => {
      component.raw.set(
        "https://www.redgifs.com/users/problematicberries | Poppyandzach's Porn GIF Collections | RedGIFs\n" +
          "https://www.redgifs.com/users/naturalbornleader | ♡ Lia Tease ♡'s Porn GIF Collections | RedGIFs\n" +
          'https://www.youtube.com/shorts/hfNyNLEGj2I | Ancient homes built into the earth - YouTube'
      );
      const items = component.parsedItems();
      expect(items).toHaveLength(3);
      expect(items[0]).toEqual({
        url: 'https://www.redgifs.com/users/problematicberries',
        title: "Poppyandzach's Porn GIF Collections | RedGIFs"
      });
      expect(items[1]).toEqual({
        url: 'https://www.redgifs.com/users/naturalbornleader',
        title: "♡ Lia Tease ♡'s Porn GIF Collections | RedGIFs"
      });
      expect(items[2]).toEqual({
        url: 'https://www.youtube.com/shorts/hfNyNLEGj2I',
        title: 'Ancient homes built into the earth - YouTube'
      });
    });

    it('should return empty array for empty input', () => {
      component.raw.set('');
      expect(component.parsedItems()).toHaveLength(0);
    });

    it('should handle Windows line endings', () => {
      component.raw.set('https://example.com/\r\nhttps://example2.com/ | Title\r\n');
      const items = component.parsedItems();
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({ url: 'https://example.com/', title: null });
      expect(items[1]).toEqual({ url: 'https://example2.com/', title: 'Title' });
    });
  });
});
