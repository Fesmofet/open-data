import { deterministicContractId, newOblDisputeId, newOblInvoiceId, newOblOfferId, newOblPaymentConfirmId, newOblPaymentDeclareId } from './obl-ids';

describe('deterministicContractId', () => {
  it('is stable regardless of account order', () => {
    expect(deterministicContractId('offer-1', 'alice', 'bob')).toBe(
      deterministicContractId('offer-1', 'bob', 'alice'),
    );
  });

  it('includes offer id and sorted pair', () => {
    expect(deterministicContractId('offer-1', 'bob', 'alice')).toBe(
      'contract-offer-1-alice-bob',
    );
  });
});

describe('prefixed OBL client ids', () => {
  const sample = '00000000-0000-4000-8000-000000000000';

  it('newOblInvoiceId', () => {
    expect(newOblInvoiceId(sample)).toBe(`inv-${sample}`);
  });

  it('newOblPaymentDeclareId', () => {
    expect(newOblPaymentDeclareId(sample)).toBe(`pay-${sample}`);
  });

  it('newOblPaymentConfirmId', () => {
    expect(newOblPaymentConfirmId(sample)).toBe(`pay-recv-${sample}`);
  });

  it('newOblDisputeId', () => {
    expect(newOblDisputeId(sample)).toBe(`dispute-${sample}`);
  });

  it('newOblOfferId', () => {
    expect(newOblOfferId(sample)).toBe(`obl-offer-${sample}`);
  });
});
