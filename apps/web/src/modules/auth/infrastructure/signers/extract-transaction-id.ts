export function extractTransactionIdFromBroadcastResult(result: unknown): string | null {
  if (typeof result === 'string' && result.trim().length > 0) {
    return result.trim();
  }
  if (!result || typeof result !== 'object') {
    return null;
  }
  const root = result as Record<string, unknown>;
  const nested = root.result;
  if (nested && typeof nested === 'object') {
    const nestedObj = nested as Record<string, unknown>;
    const nestedId = nestedObj.id ?? nestedObj.transaction_id ?? nestedObj.tx_id;
    if (typeof nestedId === 'string' && nestedId.trim().length > 0) {
      return nestedId.trim();
    }
  }
  const id = root.id ?? root.transaction_id ?? root.tx_id;
  if (typeof id === 'string' && id.trim().length > 0) {
    return id.trim();
  }
  return null;
}

export function extractTransactionIdFromHasResult(result: unknown): string | null {
  if (typeof result === 'string' && result.trim().length > 0) {
    return result.trim();
  }
  if (!result || typeof result !== 'object') {
    return null;
  }
  const root = result as Record<string, unknown>;
  const data = root.data;
  if (typeof data === 'string' && data.trim().length > 0) {
    return data.trim();
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const id = d.id ?? d.tx_id ?? d.transaction_id;
    if (typeof id === 'string' && id.trim().length > 0) {
      return id.trim();
    }
  }
  return extractTransactionIdFromBroadcastResult(result);
}
