import type { OblInvoice, OblObligationLine } from '@opden-data-layer/core';
import type { OdlEventContext } from '../../odl-shared';
import type { OblRepository } from '../../../repositories/obl.repository';
import { DisputeOpenHandler } from './dispute-open.handler';

const invoiceHeader: OblInvoice = {
  invoice_id: 'inv-1',
  contract_id: null,
  issuer: 'alice',
  debtor: 'bob',
  kind: 'single',
  details: {},
  created_event_seq: BigInt(10),
  transaction_id: 'tx-inv',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
};

const invoiceLine: OblObligationLine = {
  line_id: 'inv-1:0',
  invoice_id: 'inv-1',
  debtor: 'bob',
  beneficiary: 'alice',
  amount_usd: '10.00000000',
  final_amount_usd: null,
  state: 'confirmed',
  dispute_group: 'inv-1',
  role: null,
  pair_low: 'alice',
  pair_high: 'bob',
  created_event_seq: BigInt(10),
  transaction_id: 'tx-inv',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
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
    const findInvoice = jest.fn().mockResolvedValue(invoiceHeader);
    const listLinesForInvoice = jest
      .fn()
      .mockResolvedValue([{ ...invoiceLine, state: 'resolved' }]);
    const insertDispute = jest.fn();

    const handler = new DisputeOpenHandler({
      findInvoice,
      listLinesForInvoice,
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
    const findInvoice = jest.fn().mockResolvedValue(invoiceHeader);
    const listLinesForInvoice = jest.fn().mockResolvedValue([invoiceLine]);
    const insertDispute = jest.fn();

    const handler = new DisputeOpenHandler({
      findInvoice,
      listLinesForInvoice,
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

  it('opens dispute and marks invoice lines disputed', async () => {
    const updateLinesStateForInvoice = jest.fn();
    const insertDispute = jest.fn();
    const runInTransaction = jest.fn(async (fn: (trx: unknown) => Promise<void>) => fn({}));

    const handler = new DisputeOpenHandler({
      findInvoice: jest.fn().mockResolvedValue(invoiceHeader),
      listLinesForInvoice: jest.fn().mockResolvedValue([invoiceLine]),
      findDispute: jest.fn().mockResolvedValue(null),
      findOpenDisputeForInvoice: jest.fn().mockResolvedValue(null),
      insertDispute,
      runInTransaction,
      updateLinesStateForInvoice,
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

    expect(runInTransaction).toHaveBeenCalled();
    expect(insertDispute).toHaveBeenCalled();
    expect(updateLinesStateForInvoice).toHaveBeenCalledWith(
      'inv-1',
      { state: 'disputed' },
      expect.anything(),
    );
  });
});
