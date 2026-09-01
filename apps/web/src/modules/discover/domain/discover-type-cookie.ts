import { OBJECT_TYPE_REGISTRY } from '@opden-data-layer/core/object-type-registry';

import { DISCOVER_ALL_OBJECT_TYPES } from './discover-url';

export const DISCOVER_TYPE_COOKIE = 'discover_object_type';

const DISCOVER_TYPE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function readCookieFromDocument(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

function isPersistableDiscoverObjectType(objectType: string): boolean {
  const trimmed = objectType.trim();
  if (!trimmed || trimmed === DISCOVER_ALL_OBJECT_TYPES) {
    return false;
  }
  return trimmed in OBJECT_TYPE_REGISTRY;
}

/** Client-side: read remembered discover object type. */
export function readDiscoverObjectTypeCookie(): string | null {
  const raw = readCookieFromDocument(DISCOVER_TYPE_COOKIE);
  if (raw == null) {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Client-side: persist picked object type (never users or `all`). */
export function writeDiscoverObjectTypeCookie(objectType: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  if (!isPersistableDiscoverObjectType(objectType)) {
    return;
  }
  const trimmed = objectType.trim();
  document.cookie = `${DISCOVER_TYPE_COOKIE}=${encodeURIComponent(trimmed)}; Max-Age=${DISCOVER_TYPE_COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
}
