import {
  classifyWaivWithdrawDeposit,
  isWaivMutualTransaction,
  stableOperationIndex,
  stableWaivAdvancedReportOperationIndex,
} from './index';

describe('waiv-advanced-report', () => {
  const filterAccounts = ['alice', 'bob'];

  it('classifies transfer direction', () => {
    expect(
      classifyWaivWithdrawDeposit({
        type: 'tokens_transfer',
        record: { type: 'tokens_transfer', from: 'bob', to: 'alice' },
        userName: 'alice',
        filterAccounts: ['alice'],
      }),
    ).toBe('d');
    expect(
      classifyWaivWithdrawDeposit({
        type: 'tokens_transfer',
        record: { type: 'tokens_transfer', from: 'alice', to: 'bob' },
        userName: 'alice',
        filterAccounts: ['alice'],
      }),
    ).toBe('w');
  });

  it('excludes mutual transfer between filter accounts', () => {
    expect(
      isWaivMutualTransaction({
        record: { type: 'tokens_transfer', from: 'alice', to: 'bob' },
        userName: 'alice',
        filterAccounts,
      }),
    ).toBe(true);
    expect(
      classifyWaivWithdrawDeposit({
        type: 'tokens_transfer',
        record: { type: 'tokens_transfer', from: 'alice', to: 'bob' },
        userName: 'alice',
        filterAccounts,
      }),
    ).toBe('');
  });

  it('classifies stake edge cases', () => {
    expect(
      classifyWaivWithdrawDeposit({
        type: 'tokens_stake',
        record: { type: 'tokens_stake', from: 'bob', to: 'alice' },
        userName: 'alice',
        filterAccounts: ['alice'],
      }),
    ).toBe('d');
    expect(
      classifyWaivWithdrawDeposit({
        type: 'tokens_stake',
        record: { type: 'tokens_stake', from: 'alice', to: 'alice' },
        userName: 'alice',
        filterAccounts: ['alice'],
      }),
    ).toBe('');
  });

  it('classifies swap by symbolOut', () => {
    expect(
      classifyWaivWithdrawDeposit({
        type: 'marketpools_swapTokens',
        record: { type: 'marketpools_swapTokens', symbolOut: 'WAIV' },
        userName: 'alice',
        filterAccounts: ['alice'],
      }),
    ).toBe('d');
    expect(
      classifyWaivWithdrawDeposit({
        type: 'marketpools_swapTokens',
        record: { type: 'marketpools_swapTokens', symbolOut: 'HIVE' },
        userName: 'alice',
        filterAccounts: ['alice'],
      }),
    ).toBe('w');
  });

  it('stable operation index is deterministic and positive', () => {
    const a = stableWaivAdvancedReportOperationIndex({
      source: 'rpc',
      account: 'alice',
      timestamp: 1_700_000_000,
      tieId: 'abc:123:tokens_transfer',
    });
    const b = stableWaivAdvancedReportOperationIndex({
      source: 'rpc',
      account: 'alice',
      timestamp: 1_700_000_000,
      tieId: 'abc:123:tokens_transfer',
    });
    expect(a).toBe(b);
    expect(a).toBeGreaterThan(0);
    expect(stableOperationIndex(['x', 'y'])).not.toBe(
      stableOperationIndex(['x', 'z']),
    );
  });

  describe('stableWaivAdvancedReportOperationIndex contract (exemptions)', () => {
    const ts = 1_700_000_000;
    const account = 'grampo';

    it('golden RPC transfer with from/to/quantity', () => {
      expect(
        stableWaivAdvancedReportOperationIndex({
          source: 'rpc',
          account,
          timestamp: ts,
          tieId: 'tx-batch:tokens_transfer:grampo:jeffjagoe:1500',
        }),
      ).toBe(1_958_190_689);
    });

    it('golden reward rows with distinct authorperm produce distinct indices', () => {
      const rewardA = stableWaivAdvancedReportOperationIndex({
        source: 'rpc',
        account,
        timestamp: ts,
        tieId: 'tx-reward:comments_curationReward:@author/post-a:0.16709602',
      });
      const rewardB = stableWaivAdvancedReportOperationIndex({
        source: 'rpc',
        account,
        timestamp: ts,
        tieId: 'tx-reward:comments_curationReward:@author/post-b:0.16711291',
      });
      expect(rewardA).toBe(24_692_100);
      expect(rewardB).toBe(54_230_220);
      expect(rewardA).not.toBe(rewardB);
    });

    it('golden PG swap and airdrop rows', () => {
      expect(
        stableWaivAdvancedReportOperationIndex({
          source: 'pg',
          account: 'alice',
          timestamp: ts,
          tieId: 'swap:42',
        }),
      ).toBe(1_994_709_681);
      expect(
        stableWaivAdvancedReportOperationIndex({
          source: 'pg',
          account: 'alice',
          timestamp: ts,
          tieId: 'airdrop:7',
        }),
      ).toBe(381_940_031);
    });

    it('legacy tieId without from/to yields a different index than current tieId', () => {
      const legacyTieId = 'tx-batch:tokens_transfer:1500';
      const currentTieId = 'tx-batch:tokens_transfer:grampo:jeffjagoe:1500';
      const legacyIndex = stableWaivAdvancedReportOperationIndex({
        source: 'rpc',
        account,
        timestamp: ts,
        tieId: legacyTieId,
      });
      const currentIndex = stableWaivAdvancedReportOperationIndex({
        source: 'rpc',
        account,
        timestamp: ts,
        tieId: currentTieId,
      });
      expect(legacyIndex).toBe(1_625_497_144);
      expect(currentIndex).toBe(1_958_190_689);
      expect(legacyIndex).not.toBe(currentIndex);
    });
  });
});
