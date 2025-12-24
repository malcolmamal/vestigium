export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('youtube.com') || u.hostname.endsWith('www.youtube.com')) {
      if (u.pathname === '/watch') {
        return u.searchParams.get('v');
      }
      if (u.pathname.startsWith('/embed/')) {
        return u.pathname.split('/')[2];
      }
      if (u.pathname.startsWith('/v/')) {
        return u.pathname.split('/')[2];
      }
      if (u.pathname.startsWith('/shorts/')) {
        return u.pathname.split('/')[2];
      }
    }
    if (u.hostname.endsWith('youtu.be')) {
      return u.pathname.slice(1);
    }
  } catch {
    // ignore invalid urls
  }
  return null;
}

