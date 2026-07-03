import type {
  PostExpertiseDelta,
  PostExpertiseInput,
  PostObjectExpertiseShare,
} from './post-reward.types';
import { parsePayoutAmount } from './parse-payout-amount';
import { expertiseMultiplierForCreatedUnix } from './post-expertise.constants';

/**
 * Legacy `authorExpertise` total payout USD at cashout (Hive strings + WAIV tokens).
 */
export function calculatePostExpertiseBaseUsd(
  input: PostExpertiseInput,
  waivUsdRate: number,
): number {
  const maxPayout = parsePayoutAmount(input.maxAcceptedPayout);
  const pendingPayout = parsePayoutAmount(input.pendingPayoutValue);
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

  let totalPayoutUsd =
    pendingPayout + totalAuthorPayout + totalCuratorPayout + waivPayoutUsd;

  if (totalPayoutUsd < 0) {
    totalPayoutUsd = 0;
  }
  if (maxPayout > 0 && totalPayoutUsd > maxPayout) {
    totalPayoutUsd = maxPayout;
  }

  const multiplier = expertiseMultiplierForCreatedUnix(input.createdUnix);
  return Number((totalPayoutUsd * multiplier).toFixed(8));
}

export function splitPostExpertiseByObjects(
  expertiseBaseUsd: number,
  objects: PostObjectExpertiseShare[],
): PostExpertiseDelta[] {
  if (expertiseBaseUsd <= 0 || objects.length === 0) {
    return [];
  }

  const deltas: PostExpertiseDelta[] = [];
  const deltaByObjectId = new Map<string, number>();
  for (const obj of objects) {
    if (obj.percent <= 0) {
      continue;
    }
    const delta = Number((expertiseBaseUsd * (obj.percent / 100)).toFixed(8));
    if (delta > 0) {
      deltaByObjectId.set(obj.objectId, (deltaByObjectId.get(obj.objectId) ?? 0) + delta);
    }
  }
  for (const [objectId, delta] of deltaByObjectId) {
    deltas.push({ objectId, delta: Number(delta.toFixed(8)) });
  }
  return deltas;
}

export function calculatePostExpertiseDeltas(
  input: PostExpertiseInput,
  waivUsdRate: number,
  objects: PostObjectExpertiseShare[],
): PostExpertiseDelta[] {
  const base = calculatePostExpertiseBaseUsd(input, waivUsdRate);
  return splitPostExpertiseByObjects(base, objects);
}
