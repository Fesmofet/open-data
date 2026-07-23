import {
  invoiceIssuePayloadSchema,
  paymentDeclarePayloadSchema,
} from './obl-envelope.schema';

describe('obl-envelope amount_usd validation', () => {
  it('rejects junk inside invoice amount_usd strings', () => {
    const result = invoiceIssuePayloadSchema.safeParse({
      invoice_id: 'inv-1',
      issuer: 'alice',
      debtor: 'bob',
      creditor: 'alice',
      amount_usd: '1dfdf.5',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid invoice amount_usd strings', () => {
    const result = invoiceIssuePayloadSchema.safeParse({
      invoice_id: 'inv-1',
      issuer: 'alice',
      debtor: 'bob',
      creditor: 'alice',
      amount_usd: '12.5',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount_usd).toBe('12.50000000');
    }
  });

  it('rejects zero payment amounts', () => {
    const result = paymentDeclarePayloadSchema.safeParse({
      payment_id: 'pay-1',
      payer: 'alice',
      receiver: 'bob',
      amount_usd: '0',
    });
    expect(result.success).toBe(false);
  });

  it('accepts beneficiaries array for multi invoice', () => {
    const result = invoiceIssuePayloadSchema.safeParse({
      invoice_id: 'inv-2',
      issuer: 'organizer',
      debtor: 'sponsor',
      contract_id: 'c-1',
      beneficiaries: [
        { beneficiary: 'winner', amount_usd: '5' },
        { beneficiary: 'referral', amount_usd: '1', role: 'referral_fee' },
      ],
    });
    expect(result.success).toBe(true);
  });
});
