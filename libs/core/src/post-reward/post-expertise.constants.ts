/** Unix seconds for 2021-06-30T23:59:59Z — HF25 expertise multiplier cutoff. */
export const HF25_EXPERTISE_CUTOFF_UNIX = 1_625_078_399;

export const EXPERTISE_MULTIPLIER_POST_HF25 = 0.5;
export const EXPERTISE_MULTIPLIER_PRE_HF25 = 0.75;

export function expertiseMultiplierForCreatedUnix(createdUnix: number): number {
  return createdUnix > HF25_EXPERTISE_CUTOFF_UNIX
    ? EXPERTISE_MULTIPLIER_POST_HF25
    : EXPERTISE_MULTIPLIER_PRE_HF25;
}
