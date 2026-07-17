import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { OblRepository } from '../../repositories/obl.repository';
import { OblRelationshipsService } from './obl-relationships.service';

describe('OblRelationshipsService detail getters', () => {
  let service: OblRelationshipsService;
  const findInvoiceById = jest.fn();
  const findDisputeById = jest.fn();
  const findContractWithOffer = jest.fn();

  beforeEach(async () => {
    findInvoiceById.mockReset();
    findDisputeById.mockReset();
    findContractWithOffer.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OblRelationshipsService,
        {
          provide: OblRepository,
          useValue: { findInvoiceById, findDisputeById, findContractWithOffer },
        },
      ],
    }).compile();
    service = module.get(OblRelationshipsService);
  });

  it('getContract returns serialized contract with offer fields and arbiter', async () => {
    findContractWithOffer.mockResolvedValue({
      contract_id: 'c-1',
      offer_id: 'offer-1',
      offer_version: 1,
      provider: 'alice',
      client: 'bob',
      dispute_rule: 'arbiter',
      arbiter: 'judge',
      metadata: {},
      pair_low: 'alice',
      pair_high: 'bob',
      created_event_seq: BigInt(8),
      transaction_id: 'txc',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      offer_name: 'Design sprint',
      offer_description: 'Scoped delivery',
    });

    const result = await service.getContract('c-1');

    expect(result.arbiter).toBe('judge');
    expect(result.offer_name).toBe('Design sprint');
    expect(result.offer_description).toBe('Scoped delivery');
  });

  it('getInvoice returns serialized invoice and contract summary', async () => {
    findInvoiceById.mockResolvedValue({
      invoice_id: 'inv-1',
      contract_id: 'c-1',
      issuer: 'alice',
      debtor: 'bob',
      creditor: 'alice',
      amount_usd: '100',
      final_amount_usd: null,
      details: {},
      state: 'confirmed',
      pair_low: 'alice',
      pair_high: 'bob',
      created_event_seq: BigInt(10),
      transaction_id: 'tx1',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    });
    findContractWithOffer.mockResolvedValue({
      contract_id: 'c-1',
      offer_id: 'offer-1',
      offer_version: 1,
      provider: 'alice',
      client: 'bob',
      dispute_rule: 'client',
      arbiter: null,
      metadata: {},
      pair_low: 'alice',
      pair_high: 'bob',
      created_event_seq: BigInt(8),
      transaction_id: 'txc',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      offer_name: 'Design sprint',
      offer_description: null,
    });

    const result = await service.getInvoice('inv-1');

    expect(result.invoice.invoice_id).toBe('inv-1');
    expect(result.contract?.offer_name).toBe('Design sprint');
  });

  it('getInvoice throws when invoice missing', async () => {
    findInvoiceById.mockResolvedValue(null);
    await expect(service.getInvoice('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getDispute returns dispute with linked invoice and contract', async () => {
    findDisputeById.mockResolvedValue({
      dispute_id: 'd-1',
      invoice_id: 'inv-1',
      disputant: 'bob',
      proposed_amount_usd: '80',
      status: 'open',
      final_amount_usd: null,
      resolver: null,
      created_event_seq: BigInt(11),
      resolved_event_seq: null,
      transaction_id: 'txd',
      created_at: new Date('2026-01-02T00:00:00.000Z'),
    });
    findInvoiceById.mockResolvedValue({
      invoice_id: 'inv-1',
      contract_id: 'c-1',
      issuer: 'alice',
      debtor: 'bob',
      creditor: 'alice',
      amount_usd: '100',
      final_amount_usd: null,
      details: {},
      state: 'disputed',
      pair_low: 'alice',
      pair_high: 'bob',
      created_event_seq: BigInt(10),
      transaction_id: 'tx1',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    });
    findContractWithOffer.mockResolvedValue(null);

    const result = await service.getDispute('d-1');

    expect(result.dispute.dispute_id).toBe('d-1');
    expect(result.invoice.invoice_id).toBe('inv-1');
    expect(result.contract).toBeNull();
  });
});
