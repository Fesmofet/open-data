import { Test } from '@nestjs/testing';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import {
  HiveEngineClient,
  HiveEngineUnavailableError,
} from '@opden-data-layer/clients';

import { AccountsCurrentRepository } from '../../repositories';
import { PostUserEngineSwapQuoteEndpoint } from './post-user-engine-swap-quote.endpoint';

describe('PostUserEngineSwapQuoteEndpoint', () => {
  let endpoint: PostUserEngineSwapQuoteEndpoint;
  let accounts: jest.Mocked<Pick<AccountsCurrentRepository, 'findByName'>>;
  let hiveEngine: jest.Mocked<
    Pick<
      HiveEngineClient,
      | 'findMarketPools'
      | 'findOneMarketPoolParam'
      | 'findTokenBalances'
      | 'findTokens'
    >
  >;

  beforeEach(async () => {
    accounts = { findByName: jest.fn() };
    hiveEngine = {
      findMarketPools: jest.fn(),
      findOneMarketPoolParam: jest.fn(),
      findTokenBalances: jest.fn(),
      findTokens: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PostUserEngineSwapQuoteEndpoint,
        { provide: AccountsCurrentRepository, useValue: accounts },
        { provide: HiveEngineClient, useValue: hiveEngine },
      ],
    }).compile();

    endpoint = moduleRef.get(PostUserEngineSwapQuoteEndpoint);
  });

  it('returns null when account is missing', async () => {
    accounts.findByName.mockResolvedValue(undefined);
    await expect(
      endpoint.execute('ghost', {
        fromSymbol: 'WAIV',
        toSymbol: 'SWAP.HIVE',
        amountIn: '1',
        direction: 'exactInput',
      }),
    ).resolves.toBeNull();
  });

  it('returns swap quote for known account', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    hiveEngine.findMarketPools.mockResolvedValue([
      {
        tokenPair: 'SWAP.HIVE:WAIV',
        baseQuantity: '100000',
        quoteQuantity: '500000',
        basePrice: '5',
        quotePrice: '0.2',
        precision: 8,
      },
    ] as never);
    hiveEngine.findOneMarketPoolParam.mockResolvedValue({ tradeFeeMul: '0.9975' } as never);
    hiveEngine.findTokenBalances.mockResolvedValue([
      { symbol: 'WAIV', balance: '100' },
    ] as never);
    hiveEngine.findTokens.mockResolvedValue([
      { symbol: 'WAIV', name: 'WAIV', precision: 8, metadata: '{}' },
      { symbol: 'SWAP.HIVE', name: 'SWAP.HIVE', precision: 8, metadata: '{}' },
    ] as never);

    const result = await endpoint.execute('alice', {
      fromSymbol: 'WAIV',
      toSymbol: 'SWAP.HIVE',
      amountIn: '10',
      direction: 'exactInput',
    });

    expect(result?.amountOut).toBeDefined();
    expect(result?.customJson.length).toBeGreaterThan(0);
  });

  it('throws ServiceUnavailableException when Hive Engine is unavailable', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    hiveEngine.findMarketPools.mockRejectedValue(new HiveEngineUnavailableError());

    await expect(
      endpoint.execute('alice', {
        fromSymbol: 'WAIV',
        toSymbol: 'SWAP.HIVE',
        amountIn: '1',
        direction: 'exactInput',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('throws BadRequestException for unavailable pair', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    hiveEngine.findMarketPools.mockResolvedValue([]);
    hiveEngine.findOneMarketPoolParam.mockResolvedValue(null);
    hiveEngine.findTokenBalances.mockResolvedValue([]);
    hiveEngine.findTokens.mockResolvedValue([]);

    await expect(
      endpoint.execute('alice', {
        fromSymbol: 'WAIV',
        toSymbol: 'SWAP.HIVE',
        amountIn: '1',
        direction: 'exactInput',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
