import type { HiveAccountWalletFields } from '@opden-data-layer/clients';
import { calculateHiveUpvotingManaPercent, netVestingShares } from './calculate-hive-voting-mana';

export type AccountVoteValueInput = {
  account: Partial<
    Pick<
      HiveAccountWalletFields,
      | 'vesting_shares'
      | 'received_vesting_shares'
      | 'delegated_vesting_shares'
      | 'voting_power'
      | 'last_vote_time'
    >
  >;
  rewardBalance: number;
  recentClaims: number;
  hiveUsd: number;
  waivStake: number;
  waivDelegationsIn: number;
  engineVotingPowerPercent: number;
  waivRewardRate: number;
  waivQuotePriceHive: number;
  hiveUsdForWaiv: number;
};

export type AccountVoteValues = {
  estimatedHiveUsd: number;
  estimatedWaivUsd: number;
  totalVoteValueUsd: number;
};

/** Legacy `calcHiveVoteValue` + `calculateHiveEngineVote` at weight 100%. */
export function calculateAccountVoteValues(
  input: AccountVoteValueInput,
  nowMs = Date.now(),
): AccountVoteValues {
  const estimatedHiveUsd = calculateHiveVoteValueUsd(
    input.account,
    input.rewardBalance,
    input.recentClaims,
    input.hiveUsd,
    nowMs,
  );
  const estimatedWaivUsd = calculateWaivVoteValueUsd({
    stake: input.waivStake,
    delegationsIn: input.waivDelegationsIn,
    votingPowerPercent: input.engineVotingPowerPercent,
    rewardRate: input.waivRewardRate,
    quotePriceHive: input.waivQuotePriceHive,
    hiveUsd: input.hiveUsdForWaiv,
  });

  const totalVoteValueUsd = Math.max(0, estimatedHiveUsd + estimatedWaivUsd);
  return {
    estimatedHiveUsd,
    estimatedWaivUsd,
    totalVoteValueUsd,
  };
}

function calculateHiveVoteValueUsd(
  account: Partial<AccountVoteValueInput['account']>,
  rewardBalance: number,
  recentClaims: number,
  hiveUsd: number,
  nowMs: number,
): number {
  const vests = netVestingShares(account);
  if (vests <= 0 || recentClaims <= 0 || rewardBalance <= 0 || hiveUsd <= 0) {
    return 0;
  }

  const vpPercent = calculateHiveUpvotingManaPercent(account, nowMs);
  const accountVotingPower = vpPercent * 100;
  const power = Math.round((accountVotingPower + 49) / 50);
  const rshares = vests * power * 100 - 50_000_000;
  const rewards = rewardBalance / recentClaims;
  const estimate = rshares * rewards * hiveUsd;
  return estimate < 0 ? 0 : estimate;
}

function calculateWaivVoteValueUsd(params: {
  stake: number;
  delegationsIn: number;
  votingPowerPercent: number;
  rewardRate: number;
  quotePriceHive: number;
  hiveUsd: number;
}): number {
  const {
    stake,
    delegationsIn,
    votingPowerPercent,
    rewardRate,
    quotePriceHive,
    hiveUsd,
  } = params;
  if (
    stake + delegationsIn <= 0 ||
    rewardRate <= 0 ||
    quotePriceHive <= 0 ||
    hiveUsd <= 0
  ) {
    return 0;
  }

  const power = (votingPowerPercent * 10_000) / 100;
  const finalRshares = stake + delegationsIn;
  const rshares = (power * finalRshares) / 10_000;
  const price = quotePriceHive * hiveUsd;
  const engineVotePrice = rshares * price * rewardRate;
  return engineVotePrice < 0 ? 0 : engineVotePrice;
}
