import { Test } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HiveEngineClient, HiveEngineUnavailableError } from '@opden-data-layer/clients';
import { CurrencyQueryService } from '@opden-data-layer/currency';

import { AccountsCurrentRepository } from '../../repositories';
import { GetUserEngineWalletEndpoint } from './get-user-engine-wallet.endpoint';

describe('GetUserEngineWalletEndpoint', () => {
  let endpoint: GetUserEngineWalletEndpoint;
  let accounts: jest.Mocked<Pick<AccountsCurrentRepository, 'findByName'>>;
  let hiveEngine: jest.Mocked<
    Pick<
      HiveEngineClient,
      'findTokenBalances' | 'findTokens' | 'findMarketMetrics'
    >
  >;
  let currencyQuery: jest.Mocked<
    Pick<CurrencyQueryService, 'marketInfo' | 'enginePoolsUsdCsv'>
  >;

  beforeEach(async () => {
    accounts = { findByName: jest.fn() };
    hiveEngine = {
      findTokenBalances: jest.fn(),
      findTokens: jest.fn(),
      findMarketMetrics: jest.fn(),
    };
    currencyQuery = {
      marketInfo: jest.fn(),
      enginePoolsUsdCsv: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetUserEngineWalletEndpoint,
        { provide: AccountsCurrentRepository, useValue: accounts },
        { provide: HiveEngineClient, useValue: hiveEngine },
        { provide: CurrencyQueryService, useValue: currencyQuery },
      ],
    }).compile();

    endpoint = moduleRef.get(GetUserEngineWalletEndpoint);
  });

  it('returns null when account is missing', async () => {
    accounts.findByName.mockResolvedValue(undefined);
    await expect(endpoint.execute('ghost')).resolves.toBeNull();
  });

  it('returns summary for known account', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    hiveEngine.findTokenBalances.mockResolvedValue([
      {
        symbol: 'SWAP.HIVE',
        balance: '1',
        stake: '0',
        pendingUnstake: '0',
        delegationsIn: '0',
        delegationsOut: '0',
        pendingUndelegations: '0',
      },
    ] as never);
    hiveEngine.findTokens.mockResolvedValue([
      {
        symbol: 'SWAP.HIVE',
        name: 'SWAP.HIVE',
        metadata: '{}',
        precision: 8,
        stakingEnabled: false,
      },
    ] as never);
    hiveEngine.findMarketMetrics.mockResolvedValue([]);
    currencyQuery.marketInfo.mockResolvedValue({
      current: { hive: { usd: 0.25 } },
    } as never);
    currencyQuery.enginePoolsUsdCsv.mockResolvedValue([
      { symbol: 'SWAP.HIVE', USD: 0.25 },
      { symbol: 'SWAP.LTC', USD: 0 },
      { symbol: 'SWAP.BTC', USD: 0 },
      { symbol: 'SWAP.ETH', USD: 0 },
    ] as never);

    const result = await endpoint.execute('alice');
    expect(result?.account).toBe('alice');
    expect(result?.pinnedTokens).toHaveLength(3);
    expect(result?.pinnedTokens[0]?.symbol).toBe('SWAP.HIVE');
    expect(result?.rates.hiveUsd).toBe(0.25);
  });

  it('throws ServiceUnavailableException when Hive Engine is unavailable', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    hiveEngine.findTokenBalances.mockRejectedValue(
      new HiveEngineUnavailableError(),
    );

    await expect(endpoint.execute('alice')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
