import { OBJECT_TYPES, type JsonValue } from '@opden-data-layer/core';

export function asJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

export function normalizePair(a: string, b: string): { pairLow: string; pairHigh: string } {
  const x = a.trim();
  const y = b.trim();
  return x <= y ? { pairLow: x, pairHigh: y } : { pairLow: y, pairHigh: x };
}

export function toUsdString(value: number | string): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error('invalid amount_usd');
  }
  return n.toFixed(8);
}

export function isServiceRefType(objectType: string, kind: 'offer' | 'request'): boolean {
  if (kind === 'offer') {
    return objectType === OBJECT_TYPES.SERVICE_OFFERED;
  }
  return objectType === OBJECT_TYPES.SERVICE_REQUESTED;
}

export function isLegalRefType(objectType: string): boolean {
  return objectType === OBJECT_TYPES.LEGAL_DOCUMENT;
}
