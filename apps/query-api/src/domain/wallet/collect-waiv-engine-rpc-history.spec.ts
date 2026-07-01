import type { HiveEngineAccountHistoryEntry } from '@opden-data-layer/clients';

import { collectWaivEngineRpcHistory } from './collect-waiv-engine-rpc-history';

function transferEntry(index: number, timestamp: number): HiveEngineAccountHistoryEntry {
  return {
    account: 'grampo',
    operation: 'tokens_transfer',
    timestamp,
    transactionId: `tx-${index}`,
    quantity: '10',
    symbol: 'WAIV',
    from: 'grampo',
    to: `peer-${index}`,
  };
}

describe('collectWaivEngineRpcHistory', () => {
  it('continues with offset when a full batch shares one timestamp', async () => {
    const sameTs = 1_700_000_000;
    const batch1 = Array.from({ length: 13 }, (_, index) => transferEntry(index, sameTs));
    const batch2 = [transferEntry(13, sameTs), transferEntry(14, sameTs)];
    const fetchBatch = jest
      .fn()
      .mockImplementationOnce(
        async (
          batchLimit: number,
          timestampEnd: number | undefined,
          _timestampStart: number | undefined,
          offset: number,
        ) => {
          expect(batchLimit).toBe(15);
          expect(timestampEnd).toBeUndefined();
          expect(offset).toBe(0);
          return { entries: batch1, unavailable: false };
        },
      )
      .mockImplementationOnce(
        async (
          batchLimit: number,
          timestampEnd: number | undefined,
          _timestampStart: number | undefined,
          offset: number,
        ) => {
          expect(batchLimit).toBe(2);
          expect(timestampEnd).toBe(sameTs);
          expect(offset).toBe(13);
          return { entries: batch2, unavailable: false };
        },
      );

    const result = await collectWaivEngineRpcHistory({
      limit: 15,
      timestampStart: 1,
      initialTimestampEnd: undefined,
      fetchBatch,
    });

    expect(result.entries).toHaveLength(15);
    expect(fetchBatch).toHaveBeenCalledTimes(2);
  });

  it('retries with offset after a partial same-timestamp batch', async () => {
    const sameTs = 1_700_000_000;
    const batch1 = Array.from({ length: 11 }, (_, index) => transferEntry(index, sameTs));
    const batch2 = [transferEntry(11, sameTs), transferEntry(12, sameTs)];
    const fetchBatch = jest
      .fn()
      .mockResolvedValueOnce({ entries: batch1, unavailable: false })
      .mockResolvedValueOnce({ entries: batch2, unavailable: false });

    const result = await collectWaivEngineRpcHistory({
      limit: 13,
      timestampStart: 1,
      initialTimestampEnd: undefined,
      fetchBatch,
    });

    expect(result.entries).toHaveLength(13);
    expect(fetchBatch).toHaveBeenCalledTimes(2);
    expect(fetchBatch.mock.calls[1]?.[3]).toBe(11);
  });
});
