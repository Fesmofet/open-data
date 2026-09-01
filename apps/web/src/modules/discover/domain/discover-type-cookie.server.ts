import 'server-only';

import { cookies } from 'next/headers';

import { DISCOVER_TYPE_COOKIE } from './discover-type-cookie';

/** Server-side: read remembered discover object type from cookie. */
export async function getCookieDiscoverObjectType(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(DISCOVER_TYPE_COOKIE)?.value;
  if (raw == null) {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}
