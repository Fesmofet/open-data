import { vestToHp, type HiveAssetLike } from '@opden-data-layer/core';

export type ClaimRewardChainContext = {
  totalVestingShares: string;
  totalVestingFundSteem: string;
};

export type ClaimRewardNotificationPayload = {
  rewardHive: string;
  rewardHbd: string;
  rewardHp: string;
};

function parseAssetAmount(value: unknown): string {
  if (typeof value === 'string') {
    const parts = value.trim().split(/\s+/);
    return parts[0] ?? '0';
  }
  return '0';
}

function formatAmountWithSymbol(amount: string, symbol: 'HIVE' | 'HBD' | 'HP'): string {
  const parsed = Number.parseFloat(amount);
  if (!Number.isFinite(parsed)) {
    return `0 ${symbol}`;
  }
  return `${parsed.toFixed(3)} ${symbol}`;
}

function toVestPayload(value: unknown): HiveAssetLike | null {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  if (value && typeof value === 'object' && 'amount' in value) {
    return value as HiveAssetLike;
  }
  return null;
}

export function parseClaimRewardNotificationPayload(
  payload: Record<string, unknown>,
  chainContext: ClaimRewardChainContext,
): ClaimRewardNotificationPayload {
  const rewardHive = parseAssetAmount(payload.reward_hive);
  const rewardHbd = parseAssetAmount(payload.reward_hbd);
  const vests = toVestPayload(payload.reward_vests);
  const hp = vests
    ? vestToHp(
        vests,
        chainContext.totalVestingShares,
        chainContext.totalVestingFundSteem,
      )
    : 0;

  return {
    rewardHive: formatAmountWithSymbol(rewardHive, 'HIVE'),
    rewardHbd: formatAmountWithSymbol(rewardHbd, 'HBD'),
    rewardHp: formatAmountWithSymbol(
      hp > 0 && Number.isFinite(hp) ? hp.toFixed(3) : '0',
      'HP',
    ),
  };
}
