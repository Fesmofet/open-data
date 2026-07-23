import { Test } from '@nestjs/testing';

import { OblRepository } from '../../repositories/obl.repository';
import { OblDisputeResolutionService } from './obl-dispute-resolution.service';

describe('OblDisputeResolutionService', () => {
  let service: OblDisputeResolutionService;
  const listResolverDisputesForAccount = jest.fn();
  const listLinesForInvoices = jest.fn();

  beforeEach(async () => {
    listResolverDisputesForAccount.mockReset();
    listLinesForInvoices.mockReset();
    const module = await Test.createTestingModule({
      providers: [
        OblDisputeResolutionService,
        {
          provide: OblRepository,
          useValue: { listResolverDisputesForAccount, listLinesForInvoices },
        },
      ],
    }).compile();
    service = module.get(OblDisputeResolutionService);
  });

  it('lists resolver disputes for provider/client rules', async () => {
    listResolverDisputesForAccount.mockResolvedValue({
      items: [
        {
          dispute: {
            dispute_id: 'd-1',
            invoice_id: 'inv-1',
            disputant: 'alice',
            proposed_amount_usd: '10',
            status: 'open',
            final_amount_usd: null,
            resolver: null,
            created_event_seq: BigInt(1),
            resolved_event_seq: null,
            transaction_id: 'tx-1',
            created_at: new Date('2026-01-01T00:00:00.000Z'),
          },
          invoice: {
            invoice_id: 'inv-1',
            contract_id: 'c-1',
            issuer: 'alice',
            debtor: 'alice',
            kind: 'single',
            details: {},
            created_event_seq: BigInt(1),
            transaction_id: 'tx-1',
            created_at: new Date('2026-01-01T00:00:00.000Z'),
          },
          contract: {
            contract_id: 'c-1',
            offer_id: 'offer-1',
            offer_version: 1,
            provider: 'bob',
            client: 'alice',
            dispute_rule: 'provider',
            arbiter: null,
            metadata: {},
            pair_low: 'alice',
            pair_high: 'bob',
            created_event_seq: BigInt(1),
            transaction_id: 'tx-1',
            created_at: new Date('2026-01-01T00:00:00.000Z'),
          },
          offer_name: 'API',
        },
      ],
      hasMore: false,
      nextCursor: null,
    });
    listLinesForInvoices.mockResolvedValue([
      {
        line_id: 'inv-1:0',
        invoice_id: 'inv-1',
        debtor: 'alice',
        beneficiary: 'carol',
        amount_usd: '10',
        final_amount_usd: null,
        state: 'disputed',
        dispute_group: 'inv-1',
        role: null,
        pair_low: 'alice',
        pair_high: 'carol',
        created_event_seq: BigInt(1),
        transaction_id: 'tx-1',
        created_at: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const result = await service.listForAccount('bob', {
      account: 'bob',
      status: 'open',
      limit: 20,
    });

    expect(listResolverDisputesForAccount).toHaveBeenCalledWith(
      'bob',
      'open',
      20,
      undefined,
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.pair).toEqual({ provider: 'bob', client: 'alice' });
  });
});
