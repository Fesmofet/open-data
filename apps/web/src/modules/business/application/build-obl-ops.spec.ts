import { buildIssueSplitInvoiceOp } from './build-obl-ops';

describe('buildIssueSplitInvoiceOp', () => {
  it('normalizes debtor and beneficiary accounts and emits beneficiaries payload', () => {
    const op = buildIssueSplitInvoiceOp({
      oblCustomJsonId: 'obl-mainnet',
      invoiceId: 'inv-1',
      issuer: 'organizer',
      debtor: '@Sponsor',
      contractId: 'c-1',
      beneficiaries: [
        { beneficiary: '@Winner', amountUsd: '50' },
        { beneficiary: 'referral', amountUsd: '5', role: ' referral_fee ' },
      ],
    });

    const payload = JSON.parse(op.json).events[0].payload as {
      debtor: string;
      beneficiaries: Array<{ beneficiary: string; amount_usd: string; role?: string }>;
      creditor?: string;
    };

    expect(payload.debtor).toBe('sponsor');
    expect(payload.creditor).toBeUndefined();
    expect(payload.beneficiaries).toEqual([
      { beneficiary: 'winner', amount_usd: '50.00000000' },
      { beneficiary: 'referral', amount_usd: '5.00000000', role: 'referral_fee' },
    ]);
    expect(op.required_posting_auths).toEqual(['organizer']);
  });

  it('rejects invalid beneficiary amount', () => {
    expect(() =>
      buildIssueSplitInvoiceOp({
        oblCustomJsonId: 'obl-mainnet',
        invoiceId: 'inv-1',
        issuer: 'organizer',
        debtor: 'sponsor',
        beneficiaries: [{ beneficiary: 'winner', amountUsd: '0' }],
      }),
    ).toThrow('invalid amount_usd');
  });
});
