/**
 * Legacy Hive nodes return Assert Exception with `data.stack[0].data.sequence`
 * when a filtered history page is empty but older ops exist (see campaigns `hiveRequests.js`).
 */
export function parseHiveAccountHistoryAssertContinueFrom(
  error: unknown,
): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const err = error as {
    data?: {
      message?: string;
      stack?: Array<{ data?: Record<string, unknown> }>;
    };
  };

  if (err.data?.message !== 'Assert Exception') {
    return undefined;
  }

  const sequence = err.data.stack?.[0]?.data?.sequence;
  if (typeof sequence !== 'number' || !Number.isFinite(sequence)) {
    return undefined;
  }

  return Math.floor(sequence);
}
