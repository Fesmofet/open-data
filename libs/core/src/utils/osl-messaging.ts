import { createHash } from 'node:crypto';

/** SHA-256 hex of sorted lowercase Hive accounts joined by `:`. */
export function computeDmPairHash(members: readonly [string, string]): string {
  const sorted = members.map((m) => m.trim().toLowerCase()).sort();
  return createHash('sha256').update(sorted.join(':'), 'utf8').digest('hex');
}

export function buildDmChannelId(pairHash: string): string {
  return `dm-${pairHash}`;
}

export function buildDmAlias(pairHash: string): string {
  return `dm:${pairHash}`;
}

export function buildObjectChannelAlias(objectId: string): string {
  return `obj:${objectId}`;
}

/** Client-chosen object channel id (one channel per object). */
export function buildObjectChannelId(objectId: string): string {
  return `obj-ch-${objectId}`;
}

export function buildOslMessageId(
  transactionId: string,
  transactionIndex: number,
  operationIndex: number,
  odlEventIndex: number,
): string {
  return `${transactionId}-${transactionIndex}-${operationIndex}-${odlEventIndex}`;
}
