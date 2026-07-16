import type { OblInvoice } from '@opden-data-layer/core';
import type { OdlEventContext } from '../../odl-shared';
import type { OblRepository } from '../../../repositories/obl.repository';
import { DisputeOpenHandler } from './dispute-open.handler';

const invoice: OblInvoice = {
  invoice_id: 'inv-1',
  contract_id: null,
  issuer: 'alice',
  debtor: 'bob',
  creditor: 'alice',
  amount_usd: '10.00000000',
  final_amount_usd: null,
  details: {},
  state: 'confirmed',
  pair_low: 'alice',
  pair_high: 'bob',
  created_event_seq: BigInt(10),
  transaction_id: 'tx-inv',
};

function ctx(creator: string): OdlEventContext {
  return {
    action: 'dispute_open',
    creator,
    blockNum: 1,
    transactionIndex: 0,
    operationIndex: 0,
    odlEventIndex: 0,
    transactionId: 'tx-dispute',
    timestamp: '2026-01-01T00:00:00.000Z',
    eventSeq: BigInt(20),
    eventIdIndexMap: new Map(),
  };
}

describe('DisputeOpenHandler', () => {
  it('rejects resolved invoices', async () => {
    const findInvoice = jest.fn().mockResolvedValue({ ...invoice, state: 'resolved' });
    const insertDispute = jest.fn();

    const handler = new DisputeOpenHandler({
      findInvoice,
      findDispute: jest.fn().mockResolvedValue(null),
      findOpenDisputeForInvoice: jest.fn().mockResolvedValue(null),
      insertDispute,
      runInTransaction: jest.fn(),
    } as unknown as OblRepository);

    await handler.handle(
      {
        dispute_id: 'd-1',
        invoice_id: 'inv-1',
        disputant: 'bob',
        proposed_amount_usd: '7',
      },
      ctx('bob'),
    );

    expect(insertDispute).not.toHaveBeenCalled();
  });

  it('rejects when invoice already has open dispute', async () => {
    const findInvoice = jest.fn().mockResolvedValue(invoice);
    const insertDispute = jest.fn();

    const handler = new DisputeOpenHandler({
      findInvoice,
      findDispute: jest.fn().mockResolvedValue(null),
      findOpenDisputeForInvoice: jest.fn().mockResolvedValue({ dispute_id: 'd-old' }),
      insertDispute,
      runInTransaction: jest.fn(),
    } as unknown as OblRepository);

    await handler.handle(
      {
        dispute_id: 'd-1',
        invoice_id: 'inv-1',
        disputant: 'bob',
        proposed_amount_usd: '7',
      },
      ctx('bob'),
    );

    expect(insertDispute).not.toHaveBeenCalled();
  });
});
