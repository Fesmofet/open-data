import {
  allowedDebtorAccounts,
  groupLedgerInvoiceRows,
  hasContractForDebtPair,
  isAttestorIssue,
  isDebtorAllowedForContracts,
  issuerInBeneficiaries,
  predictSplitLineStates,
  requiresGoverningContract,
  sumBeneficiaryAmounts,
  validateSimpleIssue,
  validateSplitIssue,
} from './invoice-issue';

const sampleContracts = [
  { provider: 'organizer', client: 'sponsor' },
] as const;

const flowmasterFesmofetContracts = [
  { provider: 'flowmaster', client: 'fesmofet' },
] as const;

describe('invoice-issue domain', () => {
  it('detects attestor issue', () => {
    expect(
      isAttestorIssue('organizer', 'sponsor', [{ beneficiary: 'winner' }]),
    ).toBe(true);
    expect(
      isAttestorIssue('alice', 'bob', [{ beneficiary: 'alice' }]),
    ).toBe(false);
  });

  it('requires governing contract for attestor', () => {
    expect(
      requiresGoverningContract('organizer', 'sponsor', [{ beneficiary: 'winner' }]),
    ).toBe(true);
  });

  it('validates simple issue within relationship pair', () => {
    expect(
      validateSimpleIssue({
        viewer: 'alice',
        counterparty: 'bob',
        debtor: 'bob',
        creditor: 'alice',
        amountUsd: '10',
      }),
    ).toBe(true);
    expect(
      validateSimpleIssue({
        viewer: 'alice',
        counterparty: 'bob',
        debtor: 'alice',
        creditor: 'bob',
        amountUsd: '0',
      }),
    ).toBe(false);
  });

  it('collects allowed debtor accounts from contracts with issuer', () => {
    expect(allowedDebtorAccounts('organizer', sampleContracts)).toEqual([
      'organizer',
      'sponsor',
    ]);
    expect(isDebtorAllowedForContracts('organizer', 'sponsor', sampleContracts)).toBe(true);
    expect(isDebtorAllowedForContracts('organizer', 'stranger', sampleContracts)).toBe(false);
  });

  it('validates split issue beneficiaries', () => {
    expect(
      validateSplitIssue({
        issuer: 'organizer',
        debtor: 'sponsor',
        contracts: sampleContracts,
        contractId: 'c-1',
        beneficiaries: [
          { beneficiary: 'winner', amountUsd: '50' },
          { beneficiary: 'referral', amountUsd: '5', role: 'referral_fee' },
        ],
      }),
    ).toBe(true);
    expect(
      validateSplitIssue({
        issuer: 'organizer',
        debtor: 'sponsor',
        contracts: sampleContracts,
        beneficiaries: [{ beneficiary: 'winner', amountUsd: '50' }],
      }),
    ).toBe(false);
    expect(
      validateSplitIssue({
        issuer: 'organizer',
        debtor: 'stranger',
        contracts: sampleContracts,
        beneficiaries: [{ beneficiary: 'winner', amountUsd: '50' }],
      }),
    ).toBe(false);
    expect(
      validateSplitIssue({
        issuer: 'organizer',
        debtor: 'sponsor',
        contracts: [],
        beneficiaries: [{ beneficiary: 'winner', amountUsd: '50' }],
      }),
    ).toBe(false);
  });

  it('sums beneficiary amounts', () => {
    expect(
      sumBeneficiaryAmounts([
        { amountUsd: '5' },
        { amountUsd: '1' },
      ]),
    ).toBe('6.00000000');
  });

  it('detects issuer in beneficiaries', () => {
    expect(
      issuerInBeneficiaries('fesmofet', [
        { beneficiary: 'shadow.hunter' },
        { beneficiary: 'fesmofet' },
      ]),
    ).toBe(true);
    expect(issuerInBeneficiaries('fesmofet', [{ beneficiary: 'shadow.hunter' }])).toBe(
      false,
    );
  });

  it('detects contract for debt pair', () => {
    expect(
      hasContractForDebtPair('flowmaster', 'fesmofet', flowmasterFesmofetContracts),
    ).toBe(true);
    expect(
      hasContractForDebtPair('flowmaster', 'shadow.hunter', flowmasterFesmofetContracts),
    ).toBe(false);
  });

  it('predicts all confirmed for attestor split', () => {
    expect(
      predictSplitLineStates({
        issuer: 'organizer',
        debtor: 'sponsor',
        contracts: sampleContracts,
        beneficiaries: [{ beneficiary: 'winner', amountUsd: '50' }],
      }),
    ).toEqual([
      { beneficiary: 'winner', amountUsd: '50', expectedState: 'confirmed' },
    ]);
  });

  it('predicts mixed states when issuer is beneficiary', () => {
    expect(
      predictSplitLineStates({
        issuer: 'fesmofet',
        debtor: 'flowmaster',
        contracts: flowmasterFesmofetContracts,
        beneficiaries: [
          { beneficiary: 'shadow.hunter', amountUsd: '10' },
          { beneficiary: 'fesmofet', amountUsd: '5' },
        ],
      }),
    ).toEqual([
      { beneficiary: 'shadow.hunter', amountUsd: '10', expectedState: 'pending' },
      { beneficiary: 'fesmofet', amountUsd: '5', expectedState: 'confirmed' },
    ]);
  });

  it('groups multi-line invoice list rows', () => {
    const grouped = groupLedgerInvoiceRows([
      {
        invoice_id: 'inv-1',
        amount_usd: '5.00000000',
        creditor: 'winner',
        state: 'confirmed',
      },
      {
        invoice_id: 'inv-1',
        amount_usd: '1.00000000',
        creditor: 'referral',
        state: 'confirmed',
      },
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.amount_usd).toBe('6.00000000');
    expect(grouped[0]?.kind).toBe('multi');
  });
});
