/** Hive vote weight basis points: 10000 = 100% of voting power. */
export const HIVE_VOTE_WEIGHT_BASIS = 10000;

/** Smallest display step: 1 bp → 0.01%. */
export const MIN_VOTE_WEIGHT_DISPLAY_PERCENT = 0.01;

function isIntegerBasisPoints(value: number): boolean {
  const abs = Math.abs(value);
  if (abs < 1 || abs > HIVE_VOTE_WEIGHT_BASIS) {
    return false;
  }
  return Math.abs(abs - Math.round(abs)) < 1e-9;
}

function hasValidIntegerWeight(weight: number | null | undefined): boolean {
  return (
    weight != null &&
    weight !== 0 &&
    Number.isFinite(weight) &&
    isIntegerBasisPoints(weight)
  );
}

function hasCorruptFractionalWeight(weight: number | null | undefined): boolean {
  return (
    weight != null &&
    weight !== 0 &&
    Number.isFinite(weight) &&
    !isIntegerBasisPoints(weight)
  );
}

/**
 * Resolves Hive vote weight in basis points (1..10000).
 */
export function resolveVoteWeightBasisPoints(
  weight: number | null | undefined,
  percent: number | null | undefined,
): number | null {
  if (hasValidIntegerWeight(weight)) {
    return Math.round(Math.abs(weight!));
  }

  if (percent != null && percent !== 0 && Number.isFinite(percent)) {
    const abs = Math.abs(percent);

    // Fractional `weight` is `rshares * 1e-6` garbage — trust integer Hive `percent`.
    if (hasCorruptFractionalWeight(weight) && isIntegerBasisPoints(abs)) {
      return Math.round(abs);
    }

    // Indexer live vote: `percent = hiveWeight / 100` (display scale 0..100).
    if (abs <= 100) {
      return Math.round(abs * 100);
    }

    if (isIntegerBasisPoints(abs)) {
      return Math.round(abs);
    }
  }

  return null;
}

/**
 * Vote weight for UI (0.01..100), legacy `basisPoints / 100`.
 */
export function formatVoteWeightPercent(
  weight: number | null | undefined,
  percent: number | null | undefined,
): number {
  const basisPoints = resolveVoteWeightBasisPoints(weight, percent);
  if (basisPoints == null) {
    return 0;
  }

  const display = basisPoints / 100;
  if (display < MIN_VOTE_WEIGHT_DISPLAY_PERCENT) {
    return MIN_VOTE_WEIGHT_DISPLAY_PERCENT;
  }

  return Math.round(display * 100) / 100;
}
