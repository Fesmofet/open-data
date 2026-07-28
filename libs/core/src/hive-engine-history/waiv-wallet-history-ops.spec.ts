import {
  buildWaivWalletHistoryRpcOps,
  classifyWaivEngineOperation,
  WAIV_HISTORY_REWARD_OPS,
  WAIV_WALLET_HISTORY_RPC_OPS,
} from './waiv-wallet-history-ops';

describe('waiv-wallet-history-ops', () => {
  it('buildWaivWalletHistoryRpcOps excludes rewards by default', () => {
    const ops = buildWaivWalletHistoryRpcOps(false).split(',');
    expect(ops).toEqual([...WAIV_WALLET_HISTORY_RPC_OPS]);
    for (const reward of WAIV_HISTORY_REWARD_OPS) {
      expect(ops).not.toContain(reward);
    }
  });

  it('buildWaivWalletHistoryRpcOps appends rewards when showRewards', () => {
    const ops = buildWaivWalletHistoryRpcOps(true).split(',');
    expect(ops.slice(0, WAIV_WALLET_HISTORY_RPC_OPS.length)).toEqual([
      ...WAIV_WALLET_HISTORY_RPC_OPS,
    ]);
    for (const reward of WAIV_HISTORY_REWARD_OPS) {
      expect(ops).toContain(reward);
    }
  });

  it('classifyWaivEngineOperation maps primary ops', () => {
    expect(classifyWaivEngineOperation('tokens_transfer')).toBe('transfer');
    expect(classifyWaivEngineOperation('marketpools_swapTokens')).toBe('swap');
    expect(classifyWaivEngineOperation('hive_engine_deposit')).toBe('deposit_instruction');
    expect(classifyWaivEngineOperation('airdrops_newAirdrop')).toBe('airdrop');
    expect(classifyWaivEngineOperation('tokens_create')).toBe('generic');
    expect(classifyWaivEngineOperation('tokens_unstakeDone')).toBe('power_down_done');
    expect(classifyWaivEngineOperation('tokens_issue')).toBe('mining');
    expect(classifyWaivEngineOperation('market_expire')).toBe('market_expire');
    expect(classifyWaivEngineOperation('market_close')).toBe('market_close');
    expect(classifyWaivEngineOperation('market_cancel')).toBe('market_cancel');
  });
});
