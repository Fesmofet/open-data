import { isOblUsdAmount, parseOblUsdAmount } from '@opden-data-layer/core/utils/obl-usd-amount';

export type InvoiceIssueMode = 'simple' | 'split';

export type BeneficiaryLineDraft = {
  beneficiary: string;
  amountUsd: string;
  role?: string;
};

export type InvoiceIssueSubmitPayload =
  | {
      mode: 'simple';
      amountUsd: string;
      parties: { debtor: string; creditor: string };
      contractId?: string;
      details?: Record<string, unknown>;
    }
  | {
      mode: 'split';
      debtor: string;
      beneficiaries: BeneficiaryLineDraft[];
      contractId?: string;
      details?: Record<string, unknown>;
    };

export function normalizeHiveAccountInput(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

export function isAttestorIssue(
  issuer: string,
  debtor: string,
  beneficiaries: readonly { beneficiary: string }[],
): boolean {
  const issuerNorm = normalizeHiveAccountInput(issuer);
  const debtorNorm = normalizeHiveAccountInput(debtor);
  if (issuerNorm === debtorNorm) {
    return false;
  }
  return !beneficiaries.some(
    (line) => normalizeHiveAccountInput(line.beneficiary) === issuerNorm,
  );
}

export function requiresGoverningContract(
  issuer: string,
  debtor: string,
  beneficiaries: readonly { beneficiary: string }[],
): boolean {
  return isAttestorIssue(issuer, debtor, beneficiaries);
}

export function issuerInBeneficiaries(
  issuer: string,
  beneficiaries: readonly { beneficiary: string }[],
): boolean {
  const issuerNorm = normalizeHiveAccountInput(issuer);
  return beneficiaries.some(
    (line) => normalizeHiveAccountInput(line.beneficiary) === issuerNorm,
  );
}

export function hasContractForDebtPair(
  debtor: string,
  beneficiary: string,
  contracts: readonly { provider: string; client: string }[],
): boolean {
  const debtorNorm = normalizeHiveAccountInput(debtor);
  const beneficiaryNorm = normalizeHiveAccountInput(beneficiary);
  return contracts.some((contract) => {
    const provider = normalizeHiveAccountInput(contract.provider);
    const client = normalizeHiveAccountInput(contract.client);
    return (
      (provider === debtorNorm && client === beneficiaryNorm) ||
      (provider === beneficiaryNorm && client === debtorNorm)
    );
  });
}

export type PredictedSplitLineState = {
  beneficiary: string;
  amountUsd: string;
  expectedState: 'confirmed' | 'pending';
};

export function predictSplitLineStates(input: {
  issuer: string;
  debtor: string;
  beneficiaries: readonly BeneficiaryLineDraft[];
  contracts: readonly { provider: string; client: string }[];
}): PredictedSplitLineState[] {
  const attestor = isAttestorIssue(input.issuer, input.debtor, input.beneficiaries);
  return input.beneficiaries.map((line) => {
    const beneficiary = normalizeHiveAccountInput(line.beneficiary);
    const expectedState: 'confirmed' | 'pending' =
      attestor ||
      hasContractForDebtPair(input.debtor, beneficiary, input.contracts)
        ? 'confirmed'
        : 'pending';
    return {
      beneficiary,
      amountUsd: line.amountUsd,
      expectedState,
    };
  });
}

export function allowedDebtorAccounts(
  issuer: string,
  contracts: readonly { provider: string; client: string }[],
): string[] {
  const issuerNorm = normalizeHiveAccountInput(issuer);
  const allowed = new Set<string>();
  for (const contract of contracts) {
    const provider = normalizeHiveAccountInput(contract.provider);
    const client = normalizeHiveAccountInput(contract.client);
    if (provider === issuerNorm || client === issuerNorm) {
      allowed.add(provider);
      allowed.add(client);
    }
  }
  return [...allowed];
}

export function isDebtorAllowedForContracts(
  issuer: string,
  debtor: string,
  contracts: readonly { provider: string; client: string }[],
): boolean {
  const debtorNorm = normalizeHiveAccountInput(debtor);
  return allowedDebtorAccounts(issuer, contracts).includes(debtorNorm);
}

export function sumBeneficiaryAmounts(
  lines: readonly { amountUsd: string }[],
): string {
  const total = lines.reduce((sum, line) => {
    const parsed = parseOblUsdAmount(line.amountUsd, 'positive');
    return sum + (parsed ? Number(parsed) : 0);
  }, 0);
  return total.toFixed(8);
}

export function isMultiInvoice(lines: readonly unknown[] | undefined): boolean {
  return (lines?.length ?? 0) > 1;
}

export function validateSimpleIssue(input: {
  viewer: string;
  counterparty: string;
  debtor: string;
  creditor: string;
  amountUsd: string;
}): boolean {
  const parties = new Set([
    normalizeHiveAccountInput(input.viewer),
    normalizeHiveAccountInput(input.counterparty),
  ]);
  if (!parties.has(normalizeHiveAccountInput(input.debtor))) {
    return false;
  }
  if (!parties.has(normalizeHiveAccountInput(input.creditor))) {
    return false;
  }
  if (normalizeHiveAccountInput(input.debtor) === normalizeHiveAccountInput(input.creditor)) {
    return false;
  }
  return isOblUsdAmount(input.amountUsd, 'positive');
}

export function validateSplitIssue(input: {
  issuer: string;
  debtor: string;
  beneficiaries: readonly BeneficiaryLineDraft[];
  contracts?: readonly { provider: string; client: string }[];
  contractId?: string;
}): boolean {
  const debtor = normalizeHiveAccountInput(input.debtor);
  if (debtor.length === 0) {
    return false;
  }
  if (!isDebtorAllowedForContracts(input.issuer, debtor, input.contracts ?? [])) {
    return false;
  }
  if (input.beneficiaries.length === 0) {
    return false;
  }
  const seen = new Set<string>();
  for (const line of input.beneficiaries) {
    const beneficiary = normalizeHiveAccountInput(line.beneficiary);
    if (beneficiary.length === 0) {
      return false;
    }
    if (beneficiary === debtor) {
      return false;
    }
    if (seen.has(beneficiary)) {
      return false;
    }
    seen.add(beneficiary);
    if (!isOblUsdAmount(line.amountUsd, 'positive')) {
      return false;
    }
    if (line.role !== undefined && line.role.trim().length > 64) {
      return false;
    }
  }
  if (
    requiresGoverningContract(input.issuer, input.debtor, input.beneficiaries) &&
    (!input.contractId || input.contractId.trim().length === 0)
  ) {
    return false;
  }
  return true;
}

export function groupLedgerInvoiceRows<T extends {
  invoice_id: string;
  kind?: 'single' | 'multi';
  amount_usd: string;
  creditor: string;
  beneficiary?: string;
  state: string;
  final_amount_usd?: string | null;
  role?: string | null;
}>(rows: readonly T[]): T[] {
  const byId = new Map<string, T[]>();
  for (const row of rows) {
    const bucket = byId.get(row.invoice_id) ?? [];
    bucket.push(row);
    byId.set(row.invoice_id, bucket);
  }
  const grouped: T[] = [];
  for (const lines of byId.values()) {
    if (lines.length === 1) {
      grouped.push(lines[0]);
      continue;
    }
    const first = lines[0];
    grouped.push({
      ...first,
      kind: 'multi',
      amount_usd: sumBeneficiaryAmounts(
        lines.map((line) => ({ amountUsd: line.amount_usd })),
      ),
      creditor: lines.map((line) => line.creditor).join(', '),
    });
  }
  return grouped;
}
