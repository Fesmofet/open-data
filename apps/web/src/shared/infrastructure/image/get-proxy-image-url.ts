/**
 * Hive images CDN — legacy Waivio `getProxyImageURL` / `getImagePathPost`
 * (`tmp/waivio-frontend-legacy/src/common/helpers/image.js`).
 *
 * Dead UGC hosts (e.g. `ipfs.busy.org`) still resolve via Hive's `0x0` proxy cache.
 * Some posts already store `images.hive.blog/{W}x{H}/…` URLs that 400 alone but work when
 * wrapped again as `0x0/{thatUrl}`.
 */

const HIVE_IMAGE_PROXY_PREFIX = 'https://images.hive.blog/0x0/';

/**
 * Hosts / path fragments that must not be wrapped.
 * Includes video poster CDNs — Hive `0x0` returns 403 for e.g. vumbnail.com.
 */
const SKIP_PROXY_SUBSTRINGS = [
  'sephora.com',
  'waivio.nyc3.digitaloceanspaces',
  'i.imgur.com',
  '.avif',
  'vumbnail.com',
  'i.ytimg.com',
  'img.youtube.com',
] as const;

const SPACES_SUBSTRING = 'nyc3.digitaloceanspaces';

const HIVE_AVATAR_PATH = /https?:\/\/images\.hive\.blog\/u\//i;
const HIVE_HOST = /https?:\/\/images\.hive\.blog\//i;
/** Hive CDN resize/proxy path — not avatars or direct `/DQm…` assets. */
const HIVE_RESIZE_PROXY_PATH = /https?:\/\/images\.hive\.blog\/(?:\d+x\d+|p)\//i;

/**
 * Strip a leading Hive `0x0` proxy prefix so URLs can be re-proxied or compared
 * to raw body/metadata URLs (legacy StoryFull lightbox).
 */
export function stripHiveImageProxyPrefix(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith(HIVE_IMAGE_PROXY_PREFIX)) {
    return trimmed.slice(HIVE_IMAGE_PROXY_PREFIX.length);
  }
  return trimmed;
}

function normalizeProtocolRelative(url: string): string {
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  return url;
}

function shouldSkipProxy(url: string): boolean {
  return SKIP_PROXY_SUBSTRINGS.some((fragment) => url.includes(fragment));
}

function isHiveAvatarUrl(url: string): boolean {
  return HIVE_AVATAR_PATH.test(url);
}

/** `https://images.hive.blog/0x0/https://images.hive.blog/…` — already double-proxied. */
function isAlreadyDoubleProxied(url: string): boolean {
  if (!url.startsWith(HIVE_IMAGE_PROXY_PREFIX)) {
    return false;
  }
  const inner = url.slice(HIVE_IMAGE_PROXY_PREFIX.length);
  return HIVE_HOST.test(inner);
}

/**
 * Standard `0x0` of a non-Hive URL (e.g. raw ipfs.busy.org). Leave as-is — re-wrapping
 * is unnecessary when this form already works (sashimi-style posts).
 */
function isZeroProxyOfExternal(url: string): boolean {
  if (!url.startsWith(HIVE_IMAGE_PROXY_PREFIX)) {
    return false;
  }
  const inner = url.slice(HIVE_IMAGE_PROXY_PREFIX.length);
  return !HIVE_HOST.test(inner);
}

/**
 * Wrap an absolute image URL with `https://images.hive.blog/0x0/` unless it is
 * on a skip-list host / Hive avatar path, or already in a working proxy form.
 */
export function getProxyImageUrl(url: string | null | undefined): string {
  if (url == null) {
    return '';
  }
  const trimmed = url.trim();
  if (trimmed === '' || trimmed.startsWith('data:')) {
    return trimmed;
  }
  // Site-relative path (not protocol-relative `//host/...`).
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  const normalized = normalizeProtocolRelative(trimmed);

  if (isHiveAvatarUrl(normalized) || shouldSkipProxy(normalized)) {
    return normalized;
  }

  // Hive resize/proxy URLs (e.g. `1280x0/https://ipfs.busy.org/…`) — often 400 alone;
  // wrapping the full URL with `0x0/` restores the image from Hive's cache.
  if (HIVE_RESIZE_PROXY_PATH.test(normalized)) {
    if (isAlreadyDoubleProxied(normalized) || isZeroProxyOfExternal(normalized)) {
      return normalized;
    }
    return `${HIVE_IMAGE_PROXY_PREFIX}${normalized}`;
  }

  // Other images.hive.blog paths (avatars handled above; direct CDN assets) — leave as-is.
  if (HIVE_HOST.test(normalized)) {
    return normalized;
  }

  if (!/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `${HIVE_IMAGE_PROXY_PREFIX}${normalized}`;
}

/**
 * Post/feed display path — skip Waivio Spaces; otherwise Hive `0x0` proxy
 * (legacy `getImagePathPost`).
 */
export function getImagePathPost(url: string | null | undefined): string {
  if (url == null) {
    return '';
  }
  const trimmed = url.trim();
  if (trimmed === '') {
    return '';
  }
  if (trimmed.includes(SPACES_SUBSTRING)) {
    return normalizeProtocolRelative(trimmed);
  }
  return getProxyImageUrl(trimmed);
}
