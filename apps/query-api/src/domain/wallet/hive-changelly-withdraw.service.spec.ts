import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ChangellyClient, HiveClient } from '@opden-data-layer/clients';
import { CurrencyQueryService } from '@opden-data-layer/currency';

import { AccountsCurrentRepository } from '../../repositories';
import { HiveChangellyWithdrawService } from './hive-changelly-withdraw.service';

describe('HiveChangellyWithdrawService', () => {
  let service: HiveChangellyWithdrawService;

  const accounts = {
    findByName: jest.fn(),
  };
  const hiveClient = {
    getAccountsStrict: jest.fn(),
  };
  const changellyClient = {
    getPairsParams: jest.fn(),
    getExchangeAmount: jest.fn(),
    createTransaction: jest.fn(),
  };
  const currencyQuery = {
    marketInfo: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HiveChangellyWithdrawService,
        { provide: AccountsCurrentRepository, useValue: accounts },
        { provide: HiveClient, useValue: hiveClient },
        { provide: ChangellyClient, useValue: changellyClient },
        { provide: CurrencyQueryService, useValue: currencyQuery },
      ],
    }).compile();

    service = module.get(HiveChangellyWithdrawService);
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    hiveClient.getAccountsStrict.mockResolvedValue([{ balance: '50.001 HIVE' }]);
    currencyQuery.marketInfo.mockResolvedValue({
      current: { hive: { usd: 2 }, hive_dollar: { usd: 1 } },
    });
    changellyClient.getPairsParams.mockResolvedValue({
      result: { minAmountFloat: '5', maxAmountFloat: '20' },
    });
    changellyClient.getExchangeAmount.mockResolvedValue({
      result: { amountTo: '0.01' },
    });
  });

  it('rejects unsupported coin on create', async () => {
    await expect(
      service.create('alice', {
        amount: 10,
        outputCoinType: 'doge',
        address: 'addr',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(changellyClient.createTransaction).not.toHaveBeenCalled();
  });

  it('rejects USD estimate above cap', async () => {
    await expect(
      service.create('alice', {
        amount: 51,
        outputCoinType: 'btc',
        address: 'bc1q0000000000000000000000000000000000000000',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(changellyClient.createTransaction).not.toHaveBeenCalled();
  });

  it('returns create response without persisting', async () => {
    changellyClient.createTransaction.mockResolvedValue({
      result: {
        memo: 'memo-1',
        receiver: 'changellyhive',
        exchangeId: 'ex-abc',
        outputAmount: '0.00042',
        trackUrl: 'https://changelly.com/track/ex-abc',
      },
    });

    const result = await service.create('alice', {
      amount: 10,
      outputCoinType: 'eth',
      address: '0x000000000000000000000000000000000000dEaD',
    });

    expect(result).toEqual({
      receiver: 'changellyhive',
      memo: 'memo-1',
      exchangeId: 'ex-abc',
      amount: 10,
      outputAmount: '0.00042',
      trackUrl: 'https://changelly.com/track/ex-abc',
    });
    expect(changellyClient.createTransaction).toHaveBeenCalledTimes(1);
  });

  it('returns range min/max even when the rate quote fails', async () => {
    changellyClient.getPairsParams.mockResolvedValue({
      result: {
        minAmountFloat: '5',
        maxAmountFloat: '20',
        minAmountFixed: '8',
      },
    });
    changellyClient.getExchangeAmount.mockResolvedValue({
      error: { message: 'Invalid amount' },
    });

    const result = await service.getRange('alice', 'btc');

    expect(result).toEqual({ min: '5', max: '20', rate: '0' });
    expect(changellyClient.getExchangeAmount).toHaveBeenCalledWith({
      to: 'btc',
      amountFrom: 8,
    });
  });
});
