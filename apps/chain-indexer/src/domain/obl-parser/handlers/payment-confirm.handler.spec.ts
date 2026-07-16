import type { OblPayment } from '@opden-data-layer/core';
import type { OdlEventContext } from '../../odl-shared';
import type { OblRepository } from '../../../repositories/obl.repository';
import { PaymentConfirmHandler } from './payment-confirm.handler';

const pendingPayment: OblPayment = {
  payment_id: 'pay-declare',
  payer: 'bob',
  receiver: 'alice',
  amount_usd: '100.00000000',
  method: 'offchain',
  token_symbol: null,
  token_amount: null,
  rate_usd: null,
  state: 'pending',
  contract_id: null,
  ref: null,
  pair_low: 'alice',
  pair_high: 'bob',
  created_event_seq: BigInt(50),
  transaction_id: 'tx-declare',
};

function ctx(): OdlEventContext {
  return {
    action: 'payment_confirm',
    creator: 'alice',
    blockNum: 1,
    transactionIndex: 0,
    operationIndex: 0,
    odlEventIndex: 0,
    transactionId: 'tx-confirm',
    timestamp: '2026-01-01T00:00:00.000Z',
    eventSeq: BigInt(60),
    eventIdIndexMap: new Map(),
  };
}

describe('PaymentConfirmHandler', () => {
  it('skips when declare payment is already confirmed', async () => {
    const findPayment = jest.fn().mockResolvedValue({
      ...pendingPayment,
      state: 'confirmed',
    });
    const runInTransaction = jest.fn();

    const handler = new PaymentConfirmHandler({
      findPayment,
      runInTransaction,
    } as unknown as OblRepository);

    await handler.handle(
      {
        payment_id: 'pay-confirm',
        receiver: 'alice',
        amount_usd: '50',
        declare_payment_id: 'pay-declare',
      },
      ctx(),
    );

    expect(runInTransaction).not.toHaveBeenCalled();
  });

  it('wraps partial confirm in transaction', async () => {
    const findPayment = jest.fn().mockResolvedValue(pendingPayment);
    const updatePayment = jest.fn().mockResolvedValue(undefined);
    const insertPayment = jest.fn().mockResolvedValue(undefined);
    const runInTransaction = jest.fn(async (fn: (trx: unknown) => Promise<void>) => fn({}));

    const handler = new PaymentConfirmHandler({
      findPayment,
      updatePayment,
      insertPayment,
      runInTransaction,
    } as unknown as OblRepository);

    await handler.handle(
      {
        payment_id: 'pay-remainder',
        receiver: 'alice',
        amount_usd: '40',
        declare_payment_id: 'pay-declare',
      },
      ctx(),
    );

    expect(runInTransaction).toHaveBeenCalled();
    expect(updatePayment).toHaveBeenCalled();
    expect(insertPayment).toHaveBeenCalled();
  });
});
