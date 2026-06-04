import type { MongoDate, MongoId } from './types';

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
