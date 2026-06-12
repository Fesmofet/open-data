import {
  computeNetRsharesWaiv,
  extractWaivEventsFromTransactions,
  parseAuthorPerm,
} from './waiv-post-reward.util';
import type { HiveEngineTransaction } from '@opden-data-layer/clients';

function commentsTx(
  partial: Partial<HiveEngineTransaction> & { action: string },
): HiveEngineTransaction {
  return {
    refHiveBlockNumber: 1,
    transactionId: 'tx',
    sender: 'voter',
    contract: 'comments',
    payload: '{}',
    executedCodeHash: '',
    hash: '',
    databaseHash: '',
    logs: '{}',
    ...partial,
  };
}

describe('parseAuthorPerm', () => {
  it('parses @author/permlink', () => {
    expect(parseAuthorPerm('@alice/my-post')).toEqual({
      author: 'alice',
      permlink: 'my-post',
    });
  });
});

describe('computeNetRsharesWaiv', () => {
  it('subtracts previous rshares on weight 0', () => {
    expect(computeNetRsharesWaiv(10, 3, 0, 0)).toBe(7);
  });

  it('replaces voter rshares on upvote', () => {
    expect(computeNetRsharesWaiv(10, 3, 5, 5000)).toBe(12);
  });
});

describe('extractWaivEventsFromTransactions', () => {
  it('extracts WAIV vote and reward log events', () => {
    const voteTx = commentsTx({
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
            data: { symbol: 'WAIV', rshares: '2.5' },
          },
        ],
      }),
    });
    const rewardTx = commentsTx({
      action: 'payout',
      logs: JSON.stringify({
        events: [
          {
            contract: 'comments',
            event: 'authorReward',
            data: {
              symbol: 'WAIV',
              quantity: '1',
              authorperm: '@alice/p1',
            },
          },
        ],
      }),
    });

    const { votes, rewards } = extractWaivEventsFromTransactions([
      voteTx,
      rewardTx,
    ]);
    expect(votes).toHaveLength(1);
    expect(votes[0].rshares).toBe(2.5);
    expect(rewards).toHaveLength(1);
    expect(rewards[0].heTransactionId).toBe('tx');
    expect(rewards[0].quantity).toBe(1);
  });
});
