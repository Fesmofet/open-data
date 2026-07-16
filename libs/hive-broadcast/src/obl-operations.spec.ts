import {
  buildOblOfferPublishOp,
  buildOblOfferUpdateOp,
  buildOblOfferRetireOp,
  buildOblContractSignOp,
  buildOblInvoiceIssueOp,
  buildOblPaymentDeclareOp,
  buildOblPaymentConfirmOp,
  buildOblDisputeOpenOp,
  buildOblDisputeResolveOp,
} from './obl-operations';

describe('obl-operations', () => {
  it('buildOblOfferPublishOp uses obl-mainnet id and offer_publish action', () => {
    const op = buildOblOfferPublishOp({
      id: 'obl-mainnet',
      offerId: 'offer-1',
      author: 'alice',
      kind: 'offer',
      name: 'API access',
      terms: { price: 10 },
      disputeRule: 'client',
    });
    expect(op.id).toBe('obl-mainnet');
    const envelope = JSON.parse(op.json) as {
      events: Array<{ action: string; payload: Record<string, unknown> }>;
    };
    expect(envelope.events[0].action).toBe('offer_publish');
    expect(envelope.events[0].payload['offer_id']).toBe('offer-1');
  });

  it('omits empty service_ref and legal_ref from offer_publish payload', () => {
    const op = buildOblOfferPublishOp({
      id: 'obl-mainnet',
      offerId: 'offer-1',
      author: 'alice',
      kind: 'offer',
      name: 'API access',
      serviceRef: '',
      legalRef: '   ',
      terms: { price: 10 },
      disputeRule: 'client',
    });
    const payload = JSON.parse(op.json).events[0].payload as Record<string, unknown>;
    expect(payload).not.toHaveProperty('service_ref');
    expect(payload).not.toHaveProperty('legal_ref');
  });

  it('buildOblContractSignOp signs with counterparty posting auth', () => {
    const op = buildOblContractSignOp({
      id: 'obl-testnet',
      contractId: 'c-1',
      offerId: 'offer-1',
      offerVersion: 1,
      provider: 'alice',
      client: 'bob',
      signer: 'bob',
    });
    expect(op.required_posting_auths).toEqual(['bob']);
  });

  it('buildOblOfferUpdateOp emits offer_update', () => {
    const op = buildOblOfferUpdateOp({
      id: 'obl-mainnet',
      offerId: 'offer-1',
      author: 'alice',
      name: 'Updated',
    });
    const envelope = JSON.parse(op.json) as {
      events: Array<{ action: string }>;
    };
    expect(envelope.events[0].action).toBe('offer_update');
  });

  it('buildOblOfferRetireOp emits offer_retire', () => {
    const op = buildOblOfferRetireOp({
      id: 'obl-mainnet',
      offerId: 'offer-1',
      author: 'alice',
    });
    const envelope = JSON.parse(op.json) as {
      events: Array<{ action: string }>;
    };
    expect(envelope.events[0].action).toBe('offer_retire');
  });

  it('buildOblInvoiceIssueOp emits invoice_issue', () => {
    const op = buildOblInvoiceIssueOp({
      id: 'obl-mainnet',
      invoiceId: 'inv-1',
      issuer: 'alice',
      debtor: 'bob',
      creditor: 'alice',
      amountUsd: 10,
    });
    expect(JSON.parse(op.json).events[0].action).toBe('invoice_issue');
  });

  it('buildOblPaymentDeclareOp emits payment_declare', () => {
    const op = buildOblPaymentDeclareOp({
      id: 'obl-mainnet',
      paymentId: 'pay-1',
      payer: 'bob',
      receiver: 'alice',
      amountUsd: 5,
    });
    expect(JSON.parse(op.json).events[0].action).toBe('payment_declare');
  });

  it('buildOblPaymentConfirmOp emits payment_confirm', () => {
    const op = buildOblPaymentConfirmOp({
      id: 'obl-mainnet',
      paymentId: 'pay-2',
      receiver: 'alice',
      amountUsd: 5,
    });
    expect(JSON.parse(op.json).events[0].action).toBe('payment_confirm');
  });

  it('buildOblDisputeOpenOp emits dispute_open', () => {
    const op = buildOblDisputeOpenOp({
      id: 'obl-mainnet',
      disputeId: 'd-1',
      invoiceId: 'inv-1',
      disputant: 'bob',
      proposedAmountUsd: 7,
    });
    expect(JSON.parse(op.json).events[0].action).toBe('dispute_open');
  });

  it('buildOblDisputeResolveOp emits dispute_resolve', () => {
    const op = buildOblDisputeResolveOp({
      id: 'obl-mainnet',
      disputeId: 'd-1',
      resolver: 'alice',
      finalAmountUsd: 8,
    });
    expect(JSON.parse(op.json).events[0].action).toBe('dispute_resolve');
  });
});
