import 'server-only';

/** Hive beneficiary row ({ account, weight } in basis points). Mirrors editor domain shape. */
export type PostEditorDefaultBeneficiary = {
  account: string;
  weight: number;
};

const DEFAULT_BENEFICIARY_ACCOUNT = 'waivio';
const DEFAULT_BENEFICIARY_PERCENT = 3;
const MIN_BENEFICIARY_PERCENT = 1;
const MAX_BENEFICIARY_PERCENT = 99;

function trimOrEmpty(v: string | undefined): string {
  return v?.trim() ?? '';
}

function parseBeneficiaryPercent(raw: string | undefined): number {
  const trimmed = trimOrEmpty(raw);
  if (trimmed === '') {
    return DEFAULT_BENEFICIARY_PERCENT;
  }
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n)) {
    return DEFAULT_BENEFICIARY_PERCENT;
  }
  return Math.min(MAX_BENEFICIARY_PERCENT, Math.max(MIN_BENEFICIARY_PERCENT, n));
}

/**
 * Default post beneficiary from runtime env (compose env_file at `next start`).
 */
export function getPostEditorDefaultBeneficiary(): PostEditorDefaultBeneficiary | null {
  const raw = process.env.POST_EDITOR_DEFAULT_BENEFICIARY_ACCOUNT;
  const account =
    raw === undefined
      ? DEFAULT_BENEFICIARY_ACCOUNT
      : trimOrEmpty(raw);
  if (account === '') {
    return null;
  }
  const percent = parseBeneficiaryPercent(
    process.env.POST_EDITOR_DEFAULT_BENEFICIARY_PERCENT,
  );
  return {
    account,
    weight: percent * 100,
  };
}
