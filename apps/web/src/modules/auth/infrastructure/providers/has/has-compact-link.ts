import type { HasAuthPayloadInput } from './has-deep-link';

/**
 * Browser-side decoder for the compact `/has` fragment produced by agent-wallet.
 * Mirrors `libs/hive-auth/src/has-compact-link.ts`; the shared round-trip
 * vectors live in the spec files on both sides.
 *
 * @see docs/apps/web/spec/has-deep-link-redirect.md
 */
export const HAS_COMPACT_LINK_VERSION = '1';

export const HAS_COMPACT_KNOWN_HOSTS = ['wss://hive-auth.arcange.eu'] as const;

const HOST_INLINE_INDEX = 255;
const UUID_BYTES = 16;

function base64UrlToBytes(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);

  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    return null;
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

function fromAscii(bytes: Uint8Array): string | null {
  let out = '';
  for (const byte of bytes) {
    if (byte < 0x21 || byte > 0x7e) {
      return null;
    }
    out += String.fromCharCode(byte);
  }
  return out;
}

/**
 * Returns the payload, or `null` when the fragment is not compact-v1 or is
 * malformed. Callers fall back to the legacy base64-of-JSON fragment.
 */
export function decodeHasAuthCompactFragment(
  fragment: string,
): HasAuthPayloadInput | null {
  if (!fragment.startsWith(HAS_COMPACT_LINK_VERSION)) {
    return null;
  }

  const body = base64UrlToBytes(fragment.slice(HAS_COMPACT_LINK_VERSION.length));
  if (!body || body.length < 1) {
    return null;
  }

  let offset = 1;
  let host: string;
  if (body[0] === HOST_INLINE_INDEX) {
    if (body.length < 2) {
      return null;
    }
    const hostLength = body[1];
    offset = 2 + hostLength;
    if (hostLength === 0 || body.length < offset) {
      return null;
    }
    const inlineHost = fromAscii(body.subarray(2, offset));
    if (!inlineHost) {
      return null;
    }
    host = inlineHost;
  } else {
    const known = HAS_COMPACT_KNOWN_HOSTS[body[0]];
    if (!known) {
      return null;
    }
    host = known;
  }

  if (body.length <= offset + UUID_BYTES * 2) {
    return null;
  }

  const account = fromAscii(body.subarray(offset + UUID_BYTES * 2));
  if (!account) {
    return null;
  }

  return {
    account,
    uuid: bytesToUuid(body.subarray(offset, offset + UUID_BYTES)),
    key: bytesToUuid(body.subarray(offset + UUID_BYTES, offset + UUID_BYTES * 2)),
    host,
  };
}
