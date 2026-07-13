import { encodeEventSeq } from '../../../libs/core/src/utils/event-seq';

import type { MongoDate, MongoId } from './types';

/** Unix time of 2015-01-01; legacy Waivio data fits in block-0 trx_index buckets after this. */
const LEGACY_EVENT_SEQ_ORIGIN_UNIX = 1_420_070_400;

/** Seconds per 30-day bucket used to map legacy timestamps into trx_index (max 1023). */
const LEGACY_TRX_INDEX_BUCKET_SEC = 86400 * 30;

/** Extract hex string from Mongo extended JSON or plain string id. */
export function mongoIdToString(id: MongoId | undefined): string | null {
  if (id == null) {
    return null;
  }
  if (typeof id === 'string') {
    return id;
  }
  if (typeof id === 'object' && '$oid' in id && typeof id.$oid === 'string') {
    return id.$oid;
  }
  return null;
}

/**
 * Parse Mongo date fields: ISO string, Date, or extended JSON `{ "$date": "..." }` / `{ "$date": ms }`.
 * Same rules as `scripts/migrate-mongo-to-pg/posts` and `users` migrators.
 */
export function parseMongoCreatedAt(raw: unknown): Date | undefined {
  if (raw == null) {
    return undefined;
  }
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? undefined : raw;
  }
  if (typeof raw === 'string') {
    const t = Date.parse(raw);
    if (Number.isNaN(t)) {
      return undefined;
    }
    return new Date(t);
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  if (typeof raw === 'object' && '$date' in (raw as object)) {
    const d = (raw as MongoDate).$date;
    if (typeof d === 'number' && Number.isFinite(d)) {
      const dt = new Date(d);
      return Number.isNaN(dt.getTime()) ? undefined : dt;
    }
    const t = Date.parse(String(d));
    if (Number.isNaN(t)) {
      return undefined;
    }
    return new Date(t);
  }
  return undefined;
}

/**
 * MongoDB ObjectId first 4 bytes (8 hex chars) are seconds since Unix epoch.
 */
export function createdAtUnixFromObjectId(oidHex: string): number {
  if (oidHex.length < 8) {
    return 0;
  }
  const secondsHex = oidHex.slice(0, 8);
  const parsed = Number.parseInt(secondsHex, 16);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Lexicographic compare of Mongo ObjectId hex strings (chronological for legacy data). */
export function compareMongoObjectIdHex(
  a: MongoId | undefined,
  b: MongoId | undefined,
): number {
  const aHex = mongoIdToString(a) ?? '';
  const bHex = mongoIdToString(b) ?? '';
  return aHex.localeCompare(bHex);
}

/**
 * Maps a MongoDB ObjectId hex into block-0 legacy event_seq (< first real Hive block).
 * Real ODL events use block_num >= 1 (event_seq >= 67_108_864), so legacy values never win
 * against on-chain data while preserving ObjectId chronological order.
 */
export function legacyEventSeqFromObjectIdHex(oidHex: string | null): bigint {
  if (!oidHex || oidHex.length < 24) {
    return 1n;
  }
  const ts = Number.parseInt(oidHex.slice(0, 8), 16);
  const machinePid = Number.parseInt(oidHex.slice(8, 14), 16);
  const random = Number.parseInt(oidHex.slice(14, 18), 16);
  const counter = Number.parseInt(oidHex.slice(18, 24), 16);

  const elapsedSec = Math.max(0, ts - LEGACY_EVENT_SEQ_ORIGIN_UNIX);
  const trxIndex = Math.min(
    1023,
    Math.floor(elapsedSec / LEGACY_TRX_INDEX_BUCKET_SEC),
  );
  const opIndex = (machinePid ^ random) & 255;
  const odlEventIndex = counter & 255;

  return encodeEventSeq({
    blockNum: 0,
    trxIndex,
    opIndex,
    odlEventIndex,
  });
}

/** True when Mongo `active_votes` contains any entry for `voter` (trimmed match). */
export function mongoActiveVotesHasVoter(
  votes: readonly { voter?: string }[] | undefined,
  voter: string,
): boolean {
  return votes?.some((v) => v.voter?.trim() === voter) ?? false;
}

/** Coerce legacy `field.body` (string or embedded object) to a string for parsers. */
export function normalizeLegacyFieldBody(body: unknown): string {
  if (typeof body === 'string') {
    return body;
  }
  if (body !== null && typeof body === 'object') {
    try {
      return JSON.stringify(body);
    } catch {
      return '';
    }
  }
  if (body === null || body === undefined) {
    return '';
  }
  return String(body);
}

/** Convert a camelCase identifier to snake_case (ASCII). */
export function camelToSnake(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [k: string]: JsonValue };

/** Recursively rename object keys from camelCase to snake_case. */
export function keysCamelToSnake(value: JsonValue): JsonValue {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => keysCamelToSnake(item));
  }
  const out: { [k: string]: JsonValue } = {};
  for (const [k, v] of Object.entries(value)) {
    out[camelToSnake(k)] = keysCamelToSnake(v as JsonValue);
  }
  return out;
}
