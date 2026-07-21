import type { DiscoverSort } from './discover-query.schema';

export type DiscoverObjectCursorPayload = {
  sort: DiscoverSort;
  /** ISO-8601 timestamp for newest/oldest pagination. */
  created_at: string;
  weight: number | null;
  object_id: string;
};

export function encodeDiscoverObjectCursor(payload: DiscoverObjectCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeDiscoverObjectCursor(raw: string): DiscoverObjectCursorPayload | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const json = Buffer.from(trimmed, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as DiscoverObjectCursorPayload;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.object_id !== 'string' ||
      typeof parsed.created_at !== 'string' ||
      parsed.created_at.length === 0 ||
      Number.isNaN(Date.parse(parsed.created_at)) ||
      (parsed.sort !== 'newest' && parsed.sort !== 'oldest' && parsed.sort !== 'rank')
    ) {
      return null;
    }
    const weight =
      parsed.weight == null
        ? null
        : typeof parsed.weight === 'number'
          ? parsed.weight
          : Number(parsed.weight);
    if (weight != null && !Number.isFinite(weight)) {
      return null;
    }
    return { ...parsed, weight };
  } catch {
    return null;
  }
}

export type DiscoverUserCursorPayload = {
  name: string;
  wobjects_weight: number | null;
  followers_count: number;
};

export function encodeDiscoverUserCursor(payload: DiscoverUserCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeDiscoverUserCursor(raw: string): DiscoverUserCursorPayload | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const json = Buffer.from(trimmed, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as DiscoverUserCursorPayload;
    if (typeof parsed !== 'object' || parsed === null || typeof parsed.name !== 'string') {
      return null;
    }
    const wobjects_weight =
      parsed.wobjects_weight == null
        ? null
        : typeof parsed.wobjects_weight === 'number'
          ? parsed.wobjects_weight
          : Number(parsed.wobjects_weight);
    if (wobjects_weight != null && !Number.isFinite(wobjects_weight)) {
      return null;
    }
    return { ...parsed, wobjects_weight };
  } catch {
    return null;
  }
}
