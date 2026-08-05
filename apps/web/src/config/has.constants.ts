/** Primary public HAS endpoint (hive-auth-wrapper default). */
export const DEFAULT_HAS_WS_URL = 'wss://hive-auth.arcange.eu';

/** Fallback endpoints tried when the configured host is unreachable. */
export const HAS_WS_URL_FALLBACKS = [
  DEFAULT_HAS_WS_URL,
  'wss://has.hiveauth.com',
] as const;

export function normalizeHasWsUrl(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

export function stripHasWsUrlTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

export function buildHasWsUrlCandidates(preferredUrl?: string): string[] {
  const ordered = preferredUrl
    ? [preferredUrl, ...HAS_WS_URL_FALLBACKS.filter((url) => url !== preferredUrl)]
    : [...HAS_WS_URL_FALLBACKS];
  return [...new Set(ordered.map(stripHasWsUrlTrailingSlash))];
}
