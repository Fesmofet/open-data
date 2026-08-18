import { randomBytes } from 'node:crypto';

/** Hive blockchain permlink max length (STEEMIT_MAX_PERMLINK_LENGTH). */
export const HIVE_PERMLINK_MAX_LENGTH = 255;

/** Slug from title is capped before final length check (legacy Steemit). */
export const HIVE_POST_TITLE_SLUG_MAX = 128;

const BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58(bytes: Uint8Array): string {
  const zeros = bytes.findIndex((b) => b !== 0);
  const leadingZeros = zeros === -1 ? bytes.length : zeros;
  let num = BigInt(0);
  const slice = zeros === -1 ? new Uint8Array(0) : bytes.subarray(zeros);
  for (const b of slice) {
    num = (num << BigInt(8)) + BigInt(b);
  }
  if (num === BigInt(0) && bytes.length > 0) {
    return '1'.repeat(leadingZeros);
  }
  let out = '';
  const fiftyEight = BigInt(58);
  while (num > BigInt(0)) {
    const rem = Number(num % fiftyEight);
    out = BASE58_ALPHABET[rem] + out;
    num = num / fiftyEight;
  }
  return '1'.repeat(leadingZeros) + out;
}

export function randomBase58String(byteLength: number): string {
  return encodeBase58(randomBytes(byteLength));
}

/**
 * Lowercase, only `[a-z0-9-]`, collapse repeated hyphens, trim edge hyphens, max length.
 */
export function sanitizeHivePermlink(raw: string): string {
  let s = raw.toLowerCase().replace(/[^a-z0-9-]+/g, '');
  s = s.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  if (s.length > HIVE_PERMLINK_MAX_LENGTH) {
    s = s.slice(0, HIVE_PERMLINK_MAX_LENGTH);
    s = s.replace(/-+$/g, '');
  }
  return s;
}

/** ASCII slug from title; returns `''` if nothing usable remains. */
export function titleToPostSlug(title: string): string {
  const normalized = title.normalize('NFKC').trim().toLowerCase();
  let out = '';
  for (const char of normalized) {
    if (/[a-z0-9]/.test(char)) {
      out += char;
    } else if (/\s/.test(char) || char === '-' || char === '_') {
      out += '-';
    } else {
      out += '-';
    }
  }
  out = out.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  if (out.length > HIVE_POST_TITLE_SLUG_MAX) {
    out = out.slice(0, HIVE_POST_TITLE_SLUG_MAX).replace(/-+$/g, '');
  }
  return out;
}

/** Root post permlink from title (no chain uniqueness check). */
export function createRootPostPermlink(title: string): string {
  const trimmed = title.trim();
  if (trimmed === '') {
    throw new Error('title is required to generate permlink');
  }
  let slug = titleToPostSlug(trimmed);
  if (slug === '') {
    slug = randomBase58String(4);
  }
  return sanitizeHivePermlink(slug);
}
