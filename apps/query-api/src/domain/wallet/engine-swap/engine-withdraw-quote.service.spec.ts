import { Test } from '@nestjs/testing';
import {
  HiveEngineClient,
  HiveEngineConvertClient,
  TribaldexClient,
} from '@opden-data-layer/clients';

import { EngineWithdrawQuoteService } from './engine-withdraw-quote.service';

const WAIV_POOL = {
  tokenPair: 'SWAP.HIVE:WAIV',
  baseQuantity: '1000000',
  quoteQuantity: '5000000',
  basePrice: '5',
  quotePrice: '0.2',
  precision: 8,
};

describe('EngineWithdrawQuoteService', () => {
  let service: EngineWithdrawQuoteService;
  let hiveEngine: jest.Mocked<
    Pick<HiveEngineClient, 'findOneMarketPoolParam' | 'findMarketPools'>
  >;
  let convertClient: jest.Mocked<Pick<HiveEngineConvertClient, 'convert'>>;
  let tribaldexClient: jest.Mocked<Pick<TribaldexClient, 'getBtcMinimumWithdrawal'>>;

  beforeEach(async () => {
    hiveEngine = {
      findOneMarketPoolParam: jest.fn(),
      findMarketPools: jest.fn(),
    };
    convertClient = { convert: jest.fn() };
    tribaldexClient = { getBtcMinimumWithdrawal: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EngineWithdrawQuoteService,
        { provide: HiveEngineClient, useValue: hiveEngine },
        { provide: HiveEngineConvertClient, useValue: convertClient },
        { provide: TribaldexClient, useValue: tribaldexClient },
      ],
    }).compile();

    service = moduleRef.get(EngineWithdrawQuoteService);
    hiveEngine.findOneMarketPoolParam.mockResolvedValue({ tradeFeeMul: '0.9975' } as never);
    hiveEngine.findMarketPools.mockResolvedValue([WAIV_POOL] as never);
    tribaldexClient.getBtcMinimumWithdrawal.mockResolvedValue(null);
  });

  it('returns previewOnly WAIV multi-hop quote without custom json', async () => {
    const result = await service.quote({
      account: 'alice',
      quantity: '100',
      inputSymbol: 'WAIV',
      outputSymbol: 'HIVE',
      previewOnly: true,
    });

    expect(result.error).toBeUndefined();
    expect(result.predictiveAmount).toBeGreaterThan(0);
    expect(result.customJsonPayload).toEqual([]);
  });

  it('rejects WAIV to ETH (disabled pegged route)', async () => {
    const result = await service.quote({
      account: 'alice',
      quantity: '1',
      inputSymbol: 'WAIV',
      outputSymbol: 'ETH',
      previewOnly: true,
    });

    expect(result.error).toBe('unsupported withdraw pair');
    expect(result.predictiveAmount).toBeNull();
    expect(result.customJsonPayload).toEqual([]);
  });

  it('rejects direct SWAP.ETH withdraw', async () => {
    const result = await service.quote({
      account: 'alice',
      quantity: '1',
      inputSymbol: 'SWAP.ETH',
      outputSymbol: 'ETH',
      previewOnly: true,
    });

    expect(result.error).toBe('unsupported withdraw pair');
    expect(result.predictiveAmount).toBeNull();
    expect(result.customJsonPayload).toEqual([]);
  });

  it('returns hivepegged payload for SWAP.HIVE to HIVE withdraw', async () => {
    const result = await service.quote({
      account: 'alice',
      quantity: '10',
      inputSymbol: 'SWAP.HIVE',
      outputSymbol: 'HIVE',
      address: 'alice',
    });

    expect(result.error).toBeUndefined();
    expect(result.predictiveAmount).toBeGreaterThan(0);
    expect(result.customJsonPayload).toHaveLength(1);
    expect(result.customJsonPayload[0]).toMatchObject({
      contractName: 'hivepegged',
      contractAction: 'withdraw',
    });
  });
});
