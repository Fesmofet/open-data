import type { HasAuthDeepLinkInput } from './has-deep-link';

/**
 * Compact fragment format for the `/has` web redirect page.
 *
 * The legacy fragment is base64 of the deep-link JSON, so it always starts with
 * `eyJ` — the exact shape of a JWT. Secret redactors in chat clients cut such
 * strings mid-way, which silently breaks login links delivered over messengers.
 * The binary form below never produces `eyJ` and is roughly a third of the size.
 *
 * @see docs/apps/web/spec/has-deep-link-redirect.md
 */
export const HAS_COMPACT_LINK_VERSION = '1';

export const HAS_COMPACT_KNOWN_HOSTS = ['wss://hive-auth.arcange.eu'] as const;

const HOST_INLINE_INDEX = 255;
const UUID_BYTES = 16;
const MAX_INLINE_HOST_BYTES = 254;

function uuidToBytes(value: string): Uint8Array | null {
  const hex = value.replace(/-/g, '').toLowerCase();
  if (hex.length !== UUID_BYTES * 2 || !/^[0-9a-f]+$/.test(hex)) {
    return null;
  }
  const bytes = new Uint8Array(UUID_BYTES);
  for (let i = 0; i < UUID_BYTES; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
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

function toAscii(value: string): Uint8Array | null {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 0x21 || code > 0x7e) {
      return null;
    }
    bytes[i] = code;
  }
  return bytes;
}

function fromAscii(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
}

/**
 * Returns the compact fragment (version marker + base64url body), or `null`
 * when the payload does not fit the format and the caller must fall back.
 */
export function encodeHasAuthCompactFragment(
  input: HasAuthDeepLinkInput,
): string | null {
  const uuid = uuidToBytes(input.uuid);
  const key = uuidToBytes(input.key);
  const account = toAscii(input.account);
  if (!uuid || !key || !account || account.length === 0) {
    return null;
  }

  const knownHostIndex = HAS_COMPACT_KNOWN_HOSTS.indexOf(
    input.host as (typeof HAS_COMPACT_KNOWN_HOSTS)[number],
  );

  let head: Uint8Array;
  if (knownHostIndex >= 0) {
    head = Uint8Array.of(knownHostIndex);
  } else {
    const host = toAscii(input.host);
    if (!host || host.length === 0 || host.length > MAX_INLINE_HOST_BYTES) {
      return null;
    }
    head = new Uint8Array(2 + host.length);
    head[0] = HOST_INLINE_INDEX;
    head[1] = host.length;
    head.set(host, 2);
  }

  const body = new Uint8Array(head.length + UUID_BYTES * 2 + account.length);
  body.set(head, 0);
  body.set(uuid, head.length);
  body.set(key, head.length + UUID_BYTES);
  body.set(account, head.length + UUID_BYTES * 2);

  return `${HAS_COMPACT_LINK_VERSION}${Buffer.from(body).toString('base64url')}`;
}

/**
 * Inverse of {@link encodeHasAuthCompactFragment}. Returns `null` when the
 * fragment is not compact-v1 or is malformed.
 */
export function decodeHasAuthCompactFragment(
  fragment: string,
): HasAuthDeepLinkInput | null {
  if (!fragment.startsWith(HAS_COMPACT_LINK_VERSION)) {
    return null;
  }

  const encoded = fragment.slice(HAS_COMPACT_LINK_VERSION.length);
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) {
    return null;
  }

  const body = new Uint8Array(Buffer.from(encoded, 'base64url'));
  if (body.length < 1) {
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
    host = fromAscii(body.subarray(2, offset));
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

  const uuid = bytesToUuid(body.subarray(offset, offset + UUID_BYTES));
  const key = bytesToUuid(
    body.subarray(offset + UUID_BYTES, offset + UUID_BYTES * 2),
  );
  const account = fromAscii(body.subarray(offset + UUID_BYTES * 2));

  return { account, uuid, key, host };
}
