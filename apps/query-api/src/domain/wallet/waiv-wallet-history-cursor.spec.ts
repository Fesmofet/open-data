import {
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
});
