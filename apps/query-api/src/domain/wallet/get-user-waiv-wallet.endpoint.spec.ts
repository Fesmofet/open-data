import { Test } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HiveEngineClient, HiveEngineUnavailableError } from '@opden-data-layer/clients';
import { CurrencyQueryService } from '@opden-data-layer/currency';

import { AccountsCurrentRepository } from '../../repositories';
import { GetUserWaivWalletEndpoint } from './get-user-waiv-wallet.endpoint';

describe('GetUserWaivWalletEndpoint', () => {
  let endpoint: GetUserWaivWalletEndpoint;
  let accounts: jest.Mocked<Pick<AccountsCurrentRepository, 'findByName'>>;
  let hiveEngine: jest.Mocked<
    Pick<
      HiveEngineClient,
      'findOneTokenBalanceStrict' | 'findTokenPendingUnstakesStrict'
    >
  >;
  let currencyQuery: jest.Mocked<Pick<CurrencyQueryService, 'engineLatestStored'>>;

  beforeEach(async () => {
    accounts = { findByName: jest.fn() };
    hiveEngine = {
      findOneTokenBalanceStrict: jest.fn(),
      findTokenPendingUnstakesStrict: jest.fn(),
    };
    currencyQuery = { engineLatestStored: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetUserWaivWalletEndpoint,
        { provide: AccountsCurrentRepository, useValue: accounts },
        { provide: HiveEngineClient, useValue: hiveEngine },
        { provide: CurrencyQueryService, useValue: currencyQuery },
      ],
    }).compile();

    endpoint = moduleRef.get(GetUserWaivWalletEndpoint);
  });

  it('returns null when account is missing', async () => {
    accounts.findByName.mockResolvedValue(null);
    await expect(endpoint.execute('ghost')).resolves.toBeNull();
  });

  it('returns summary for known account', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    hiveEngine.findOneTokenBalanceStrict.mockResolvedValue({
      balance: '1.000',
      stake: '2.000',
      delegationsIn: '0',
      delegationsOut: '0',
      pendingUnstake: '0',
      pendingUndelegations: '0',
    } as never);
    currencyQuery.engineLatestStored.mockResolvedValue({ HIVE: 0.1, USD: 0.05 });

    const result = await endpoint.execute('alice');
    expect(result?.account).toBe('alice');
    expect(result?.display.liquidWaiv).toBe('1');
    expect(result?.rates.waivUsd).toBe(0.05);
    expect(hiveEngine.findTokenPendingUnstakesStrict).not.toHaveBeenCalled();
  });

  it('returns zero balances when Hive Engine has no balance row', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    hiveEngine.findOneTokenBalanceStrict.mockResolvedValue(null);
    currencyQuery.engineLatestStored.mockResolvedValue({ HIVE: 0.1, USD: 0.05 });

    const result = await endpoint.execute('alice');
    expect(result?.balance.liquid).toBe('0');
    expect(result?.display.liquidWaiv).toBe('0');
  });

  it('loads pending unstake metadata when pendingUnstake is positive', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    hiveEngine.findOneTokenBalanceStrict.mockResolvedValue({
      balance: '0',
      stake: '5',
      delegationsIn: '0',
      delegationsOut: '0',
      pendingUnstake: '0.01',
      pendingUndelegations: '0',
    } as never);
    currencyQuery.engineLatestStored.mockResolvedValue({ HIVE: 1, USD: 1 });
    hiveEngine.findTokenPendingUnstakesStrict.mockResolvedValue([
      { nextTransactionTimestamp: 2_000 } as never,
      { nextTransactionTimestamp: 1_000 } as never,
    ]);

    const result = await endpoint.execute('alice');
    expect(hiveEngine.findTokenPendingUnstakesStrict).toHaveBeenCalled();
    expect(result?.powerDown?.nextUnstakeAt).toBe(1_000);
  });

  it('throws ServiceUnavailableException when Hive Engine is unavailable', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    hiveEngine.findOneTokenBalanceStrict.mockRejectedValue(
      new HiveEngineUnavailableError(),
    );

    await expect(endpoint.execute('alice')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
