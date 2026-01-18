export function normalizeUrl(url: string | null | undefined): string {
  if (!url) return '';

  // Requirement: if reddit link starts with www. and not old., transform to old.
  try {
    const u = new URL(url);
    if (u.hostname === 'www.reddit.com' || u.hostname === 'reddit.com') {
      u.hostname = 'old.reddit.com';
      return u.toString();
    }
  } catch {
    // If invalid URL, return as is
  }

  return url;
}
