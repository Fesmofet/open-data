import type { HiveEngineBlock, HiveEngineTransaction } from '@opden-data-layer/clients';
import { WaivPostRewardParser } from './waiv-post-reward.parser';
import type { WaivPostRewardService } from '../waiv-post-reward.service';

function commentsTx(
  partial: Partial<HiveEngineTransaction> & { action: string },
): HiveEngineTransaction {
  return {
    refHiveBlockNumber: 1,
    transactionId: 'tx',
    sender: 'bob',
    contract: 'comments',
    payload: '{}',
    executedCodeHash: '',
    hash: '',
    databaseHash: '',
    logs: '{}',
    ...partial,
  };
}

describe('WaivPostRewardParser', () => {
  it('delegates comments contract events to WaivPostRewardService', async () => {
    const handleVotes = jest.fn().mockResolvedValue(undefined);
    const handleRewards = jest.fn().mockResolvedValue(undefined);
    const parser = new WaivPostRewardParser({
      handleVotes,
      handleRewards,
    } as unknown as WaivPostRewardService);

    await parser.parseBlock({
      blockNumber: 1,
      timestamp: '2024-01-01T00:00:00.000Z',
      transactions: [
        commentsTx({
          action: 'vote',
          payload: JSON.stringify({
            author: 'alice',
            permlink: 'p1',
            voter: 'bob',
            weight: 10000,
          }),
          logs: JSON.stringify({
            events: [
              {
                contract: 'comments',
                event: 'newVote',
                data: { symbol: 'WAIV', rshares: '1' },
              },
            ],
          }),
        }),
      ],
      virtualTransactions: [],
    } as unknown as HiveEngineBlock);

    expect(handleVotes).toHaveBeenCalledTimes(1);
    expect(handleRewards).not.toHaveBeenCalled();
  });

  it('ignores non-comments contract transactions', async () => {
    const handleVotes = jest.fn();
    const handleRewards = jest.fn();
    const parser = new WaivPostRewardParser({
      handleVotes,
      handleRewards,
    } as unknown as WaivPostRewardService);

    await parser.parseBlock({
      blockNumber: 1,
      timestamp: '2024-01-01T00:00:00.000Z',
      transactions: [
        {
          ...commentsTx({ action: 'stake' }),
          contract: 'tokens',
        },
      ],
      virtualTransactions: [],
    } as unknown as HiveEngineBlock);

    expect(handleVotes).not.toHaveBeenCalled();
    expect(handleRewards).not.toHaveBeenCalled();
  });
});
