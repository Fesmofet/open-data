import {
  compareWaivHistoryCursorsDesc,
  decodeWaivWalletHistoryCursor,
  encodeWaivWalletHistoryCursor,
  isWaivHistoryRowOlderThan,
  rowCursorFromParts,
} from './waiv-wallet-history-cursor';

describe('waiv-wallet-history-cursor', () => {
  it('round-trips cursor encoding', () => {
    const payload = rowCursorFromParts(1_700_000_000, 'abc123', 'swap');
    const encoded = encodeWaivWalletHistoryCursor(payload);
    expect(decodeWaivWalletHistoryCursor(encoded)).toEqual(payload);
  });

  it('orders rows by timestamp then source then tieId', () => {
    const newer = rowCursorFromParts(100, '2', 'rpc');
    const older = rowCursorFromParts(99, '9', 'airdrop');
    expect(isWaivHistoryRowOlderThan(older, newer)).toBe(true);
    expect(isWaivHistoryRowOlderThan(newer, older)).toBe(false);
  });

  it('keeps same-timestamp transfer order aligned with pagination cursor', () => {
    const ts = 1_700_000_000;
    const jeff = rowCursorFromParts(
      ts,
      'tx-batch:tokens_transfer:grampo:jeffjagoe:1500',
      'rpc',
    );
    const gmamba = rowCursorFromParts(
      ts,
      'tx-batch:tokens_transfer:grampo:gmamba13:1500',
      'rpc',
    );
    expect(compareWaivHistoryCursorsDesc(jeff, gmamba)).toBeLessThan(0);
    expect(isWaivHistoryRowOlderThan(gmamba, jeff)).toBe(true);
    expect(isWaivHistoryRowOlderThan(jeff, gmamba)).toBe(false);
  });
});
