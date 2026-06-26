import { z } from 'zod';

const waivHistorySourceSchema = z.enum(['rpc', 'swap', 'airdrop']);

const cursorPayloadSchema = z.object({
  timestamp: z.number().int().nonnegative(),
  tieId: z.string().min(1),
  source: waivHistorySourceSchema,
});

export type WaivWalletHistoryCursorPayload = z.infer<typeof cursorPayloadSchema>;
export type WaivWalletHistorySource = z.infer<typeof waivHistorySourceSchema>;

export function encodeWaivWalletHistoryCursor(
  payload: WaivWalletHistoryCursorPayload,
): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeWaivWalletHistoryCursor(
  raw: string,
): WaivWalletHistoryCursorPayload | null {
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed: unknown = JSON.parse(json);
    const result = cursorPayloadSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Positive when `left` should appear before `right` in the descending feed. */
export function compareWaivHistoryCursorsDesc(
  left: WaivWalletHistoryCursorPayload,
  right: WaivWalletHistoryCursorPayload,
): number {
  if (left.timestamp !== right.timestamp) {
    return right.timestamp - left.timestamp;
  }
  if (left.source !== right.source) {
    const rank = (source: WaivWalletHistorySource) =>
      source === 'rpc' ? 2 : source === 'swap' ? 1 : 0;
    return rank(right.source) - rank(left.source);
  }
  return right.tieId.localeCompare(left.tieId);
}

/** True when `left` is strictly older than `right` in descending feed order. */
export function isWaivHistoryRowOlderThan(
  left: WaivWalletHistoryCursorPayload,
  right: WaivWalletHistoryCursorPayload,
): boolean {
  return compareWaivHistoryCursorsDesc(left, right) > 0;
}

export function rowCursorFromParts(
  timestamp: number,
  tieId: string,
  source: WaivWalletHistorySource,
): WaivWalletHistoryCursorPayload {
  return { timestamp, tieId, source };
}
