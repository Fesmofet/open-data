import { createHash } from 'node:crypto';

/** SHA-256 hex of sorted lowercase Hive accounts joined by `:`. */
export function computeDmPairHash(members: readonly [string, string]): string {
  const sorted = members.map((m) => m.trim().toLowerCase()).sort();
  return createHash('sha256').update(sorted.join(':'), 'utf8').digest('hex');
}
