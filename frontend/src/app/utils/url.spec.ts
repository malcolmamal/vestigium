import { normalizeUrl } from './url';

describe('URL Utility', () => {
  it('should normalize reddit.com to old.reddit.com', () => {
    expect(normalizeUrl('https://reddit.com/r/programming')).toBe(
      'https://old.reddit.com/r/programming'
    );
  });

  it('should normalize www.reddit.com to old.reddit.com', () => {
    expect(normalizeUrl('https://www.reddit.com/r/programming')).toBe(
      'https://old.reddit.com/r/programming'
    );
  });

  it('should keep old.reddit.com as is', () => {
    expect(normalizeUrl('https://old.reddit.com/r/programming')).toBe(
      'https://old.reddit.com/r/programming'
    );
  });

  it('should not normalize other domains', () => {
    expect(normalizeUrl('https://google.com')).toBe('https://google.com');
  });

  it('should handle null or undefined', () => {
    expect(normalizeUrl(null)).toBe('');
    expect(normalizeUrl(undefined)).toBe('');
  });

  it('should handle invalid URLs', () => {
    expect(normalizeUrl('not-a-url')).toBe('not-a-url');
  });
});
