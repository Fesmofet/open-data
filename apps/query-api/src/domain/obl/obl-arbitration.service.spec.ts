import { Test, TestingModule } from '@nestjs/testing';

import { OblRepository } from '../../repositories/obl.repository';
import { OblArbitrationService } from './obl-arbitration.service';

describe('OblArbitrationService', () => {
  let service: OblArbitrationService;
  const listArbitrationDisputesForAccount = jest.fn();

  beforeEach(async () => {
    listArbitrationDisputesForAccount.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OblArbitrationService,
        {
          provide: OblRepository,
          useValue: { listArbitrationDisputesForAccount },
        },
      ],
    }).compile();
    service = module.get(OblArbitrationService);
  });

  it('lists open disputes for normalized arbiter account', async () => {
    listArbitrationDisputesForAccount.mockResolvedValue({
      items: [
        {
          dispute: {
            dispute_id: 'd1',
            invoice_id: 'inv1',
            disputant: 'alice',
            proposed_amount_usd: '80',
            status: 'open',
            final_amount_usd: null,
            resolver: null,
            created_event_seq: BigInt(10),
            resolved_event_seq: null,
            transaction_id: 'tx1',
            created_at: new Date('2026-01-01T00:00:00.000Z'),
          },
          invoice: {
            invoice_id: 'inv1',
            contract_id: 'c1',
            issuer: 'bob',
            debtor: 'alice',
            creditor: 'bob',
            amount_usd: '100',
            final_amount_usd: null,
            details: {},
            state: 'disputed',
            pair_low: 'alice',
            pair_high: 'bob',
            created_event_seq: BigInt(9),
            transaction_id: 'tx0',
            created_at: new Date('2026-01-01T00:00:00.000Z'),
          },
          contract: {
            contract_id: 'c1',
            offer_id: 'offer1',
            offer_version: 1,
            provider: 'bob',
            client: 'alice',
            dispute_rule: 'arbiter',
            arbiter: 'carol',
            metadata: {},
            pair_low: 'alice',
            pair_high: 'bob',
            created_event_seq: BigInt(8),
            transaction_id: 'txc',
            created_at: new Date('2026-01-01T00:00:00.000Z'),
          },
          offer_name: 'Design sprint',
        },
      ],
      hasMore: false,
      nextCursor: null,
    });

    const result = await service.listForAccount('CAROL', {
      account: 'carol',
      status: 'open',
      limit: 20,
      cursor: undefined,
    });

    expect(listArbitrationDisputesForAccount).toHaveBeenCalledWith(
      'carol',
      'open',
      20,
      undefined,
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.offerName).toBe('Design sprint');
    expect(result.items[0]?.pair).toEqual({ provider: 'bob', client: 'alice' });
    expect(result.items[0]?.dispute.created_event_seq).toBe('10');
  });
});
