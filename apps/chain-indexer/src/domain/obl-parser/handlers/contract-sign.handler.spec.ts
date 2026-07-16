import type { OblOffer } from '@opden-data-layer/core';
import type { OdlEventContext } from '../../odl-shared';
import type { OblRepository } from '../../../repositories/obl.repository';
import { ContractSignHandler } from './contract-sign.handler';

const baseOffer: OblOffer = {
  offer_id: 'offer-1',
  version: 1,
  kind: 'offer',
  author: 'alice',
  name: 'API',
  description: null,
  tags: [],
  service_ref: null,
  legal_ref: null,
  terms: {},
  dispute_rule: 'client',
  arbiter: null,
  status: 'active',
  created_event_seq: BigInt(1),
  transaction_id: 'tx-offer',
};

function ctx(creator: string): OdlEventContext {
  return {
    action: 'contract_sign',
    creator,
    blockNum: 1,
    transactionIndex: 0,
    operationIndex: 0,
    odlEventIndex: 0,
    transactionId: 'tx-sign',
    timestamp: '2026-01-01T00:00:00.000Z',
    eventSeq: BigInt(100),
    eventIdIndexMap: new Map(),
  };
}

describe('ContractSignHandler', () => {
  let handler: ContractSignHandler;
  let findOfferVersion: jest.Mock;
  let findContract: jest.Mock;
  let hasLedgerForPair: jest.Mock;
  let runInTransaction: jest.Mock;
  let insertContract: jest.Mock;

  beforeEach(() => {
    findOfferVersion = jest.fn();
    findContract = jest.fn().mockResolvedValue(null);
    hasLedgerForPair = jest.fn().mockResolvedValue(false);
    runInTransaction = jest.fn(async (fn: (trx: unknown) => Promise<void>) => fn({}));
    insertContract = jest.fn().mockResolvedValue(undefined);
    handler = new ContractSignHandler({
      findOfferVersion,
      findContract,
      hasLedgerForPair,
      runInTransaction,
      insertContract,
      insertLedger: jest.fn(),
      promotePendingInvoicesForPair: jest.fn(),
    } as unknown as OblRepository);
  });

  it('rejects when provider does not match offer author', async () => {
    findOfferVersion.mockResolvedValue(baseOffer);
    await handler.handle(
      {
        contract_id: 'c-1',
        offer_id: 'offer-1',
        offer_version: 1,
        provider: 'wrong',
        client: 'bob',
        signer: 'bob',
      },
      ctx('bob'),
    );
    expect(insertContract).not.toHaveBeenCalled();
  });

  it('creates contract when provider matches offer author', async () => {
    findOfferVersion.mockResolvedValue(baseOffer);
    await handler.handle(
      {
        contract_id: 'c-1',
        offer_id: 'offer-1',
        offer_version: 1,
        provider: 'alice',
        client: 'bob',
        signer: 'bob',
      },
      ctx('bob'),
    );
    expect(runInTransaction).toHaveBeenCalled();
    expect(insertContract).toHaveBeenCalled();
  });
});
