import type { PostRewardInput, PostRewardUsdBreakdown } from './post-reward.types';

export function parsePayoutAmount(amount: string | null | undefined): number {
  if (amount == null || amount === '') {
    return 0;
  }
  const n = parseFloat(String(amount).replace(/\s[A-Z.]*$/i, ''));
  return Number.isFinite(n) ? n : 0;
}

export function isPostCashout(cashoutTime: string | null | undefined): boolean {
  const raw = (cashoutTime ?? '').trim();
  if (raw === '') {
    return false;
  }
  const iso = raw.includes('Z') ? raw : `${raw}.000Z`;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) {
    return false;
  }
  return ms < Date.now();
}

function normalizeBeneficiaries(
  beneficiaries: PostRewardInput['beneficiaries'],
): Array<{ account: string; percent: number }> {
  return beneficiaries
    .filter((b) => b.account.trim() !== '')
    .map((b) => ({
      account: b.account.trim(),
      percent: b.weight / 100,
    }));
}

/**
 * Legacy Waivio `calculatePayout` (Hive + WAIV USD, no campaign sponsors).
 */
export function calculatePostRewardUsd(
  input: PostRewardInput,
  waivUsdRate: number,
): PostRewardUsdBreakdown | null {
  const maxPayout = parsePayoutAmount(input.maxAcceptedPayout);
  const pendingPayout = parsePayoutAmount(input.pendingPayoutValue);
  const promoted = parsePayoutAmount(input.promoted);
  const totalAuthorPayout = parsePayoutAmount(input.totalPayoutValue);
  const totalCuratorPayout = parsePayoutAmount(input.curatorPayoutValue);

  let waivPayoutUsd = 0;
  const waivTokens =
    input.totalRewardsWaiv > 0 ? input.totalRewardsWaiv : input.totalPayoutWaiv;
  if (waivTokens > 0 && waivUsdRate > 0) {
    waivPayoutUsd = input.totalRewardsWaiv > 0
      ? input.totalRewardsWaiv * waivUsdRate
      : input.totalPayoutWaiv * waivUsdRate;
  }

  const waivPayoutHalf = waivPayoutUsd / 2;
  let payout =
    pendingPayout + totalAuthorPayout + totalCuratorPayout + waivPayoutUsd;
  const hivePayout = totalAuthorPayout + totalCuratorPayout + pendingPayout;
  const hivePayoutHalf = hivePayout / 2;
  const hbdPercent = input.percentHbd ? 0.25 : 0;
  const hbdUsd = hivePayout * hbdPercent;
  const hiveUsd = hivePayout - hbdUsd;

  if (payout < 0) {
    payout = 0;
  }
  if (maxPayout > 0 && payout > maxPayout) {
    payout = maxPayout;
  }

  const payoutLimitHit = maxPayout > 0 && payout >= maxPayout;
  const potentialUsd = pendingPayout + waivPayoutUsd;
  const paid = isPostCashout(input.cashoutTime);

  let authorUsd = hivePayoutHalf + waivPayoutHalf;
  let curatorUsd = hivePayoutHalf + waivPayoutHalf;

  if (paid) {
    authorUsd = totalAuthorPayout + waivPayoutHalf;
    curatorUsd = totalCuratorPayout + waivPayoutHalf;
  }

  const totalUsd = paid ? payout : potentialUsd;
  if (totalUsd <= 0 && promoted <= 0 && maxPayout !== 0) {
    return null;
  }

  const isPayoutDeclined = maxPayout === 0;

  let cashoutAt: string | undefined;
  if (!paid && input.cashoutTime?.trim()) {
    const raw = input.cashoutTime.trim();
    cashoutAt = raw.includes('Z') ? raw : `${raw}.000Z`;
  }

  return {
    waivUsd: waivPayoutUsd,
    hiveUsd,
    hbdUsd,
    totalUsd: paid ? payout : potentialUsd,
    authorUsd,
    curatorUsd,
    potentialUsd,
    phase: paid ? 'paid' : 'potential',
    isPayoutDeclined,
    payoutLimitHit,
    promotionCostUsd: promoted > 0 ? promoted : 0,
    cashoutAt,
    rewardPowerOnly: input.percentHbd === 0,
    beneficiaries: normalizeBeneficiaries(input.beneficiaries),
  };
}
