import { decodeHasAuthCompactFragment } from './has-compact-link';
import type { HasAuthPayloadInput } from './has-deep-link';

export type HasAuthFragmentPayload = HasAuthPayloadInput;

export function encodeHasAuthPayloadBase64(
  input: HasAuthFragmentPayload,
): string {
  return Buffer.from(JSON.stringify(input)).toString('base64');
}

export function buildHasAuthDeepLinkFromPayloadBase64(base64: string): string {
  return `has://auth_req/${base64}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertUsablePayload(payload: HasAuthFragmentPayload): HasAuthFragmentPayload {
  const account = payload.account.trim();
  const uuid = payload.uuid.trim();
  const key = payload.key.trim();
  const host = payload.host.trim();

  if (!account || !uuid || !key || !host.startsWith('wss://')) {
    throw new Error('invalid');
  }

  return { account, uuid, key, host };
}

/**
 * Accepts both fragment formats: the compact binary one emitted by current
 * agent-wallet builds, and the legacy base64-of-JSON one still produced by
 * already released binaries.
 */
export function parseHasAuthFragmentPayload(rawHash: string): HasAuthFragmentPayload {
  const payload = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
  const trimmed = payload.trim();
  if (!trimmed) {
    throw new Error('missing');
  }

  const compact = decodeHasAuthCompactFragment(trimmed);
  if (compact) {
    return assertUsablePayload(compact);
  }

  let decoded: string;
  try {
    decoded = Buffer.from(trimmed, 'base64').toString('utf8');
  } catch {
    throw new Error('invalid');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded) as unknown;
  } catch {
    throw new Error('invalid');
  }

  if (!isRecord(parsed)) {
    throw new Error('invalid');
  }

  const account = parsed.account;
  const uuid = parsed.uuid;
  const key = parsed.key;
  const host = parsed.host;

  if (
    typeof account !== 'string' ||
    typeof uuid !== 'string' ||
    typeof key !== 'string' ||
    typeof host !== 'string'
  ) {
    throw new Error('invalid');
  }

  return assertUsablePayload({ account, uuid, key, host });
}
