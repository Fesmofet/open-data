const THREE_SPEAK_HOST = /(?:^|\.)3speak\.(?:tv|online)$/i;

export function isBrokenThreeSpeakStaticThumbnail(url: string): boolean {
  return url.includes('img.3speakcontent.co');
}

export function isThreeSpeakEmbedUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  try {
    const normalized = url.startsWith('//') ? `https:${url}` : url;
    const parsed = new URL(normalized);
    return parsed.hostname === 'play.3speak.tv' || THREE_SPEAK_HOST.test(parsed.hostname);
  } catch {
    return false;
  }
}

export function parseThreeSpeakVideoIdFromEmbedUrl(url: string): string | null {
  try {
    const normalized = url.startsWith('//') ? `https:${url}` : url;
    const parsed = new URL(normalized);
    if (!isThreeSpeakEmbedUrl(normalized)) {
      return null;
    }
    const videoId = parsed.searchParams.get('v');
    if (!videoId) {
      return null;
    }
    const decoded = decodeURIComponent(videoId);
    if (decoded.includes('..')) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/** Legacy Waivio `FeedItem.js` — runtime poster from 3Speak play API. */
export async function fetchThreeSpeakThumbnail(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://play.3speak.tv/api/watch?v=${encodeURIComponent(videoId)}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as { thumbnail?: unknown };
    const thumb = data.thumbnail;
    return typeof thumb === 'string' && thumb.trim() !== '' ? thumb.trim() : null;
  } catch {
    return null;
  }
}
