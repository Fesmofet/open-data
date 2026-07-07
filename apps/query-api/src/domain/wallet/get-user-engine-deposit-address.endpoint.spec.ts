import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { HiveEngineConvertClient } from '@opden-data-layer/clients';

import { AccountsCurrentRepository } from '../../repositories';
import { GetUserEngineDepositAddressEndpoint } from './get-user-engine-deposit-address.endpoint';

describe('GetUserEngineDepositAddressEndpoint', () => {
  let endpoint: GetUserEngineDepositAddressEndpoint;
  let accounts: jest.Mocked<Pick<AccountsCurrentRepository, 'findByName'>>;
  let convertClient: jest.Mocked<Pick<HiveEngineConvertClient, 'convert'>>;

  beforeEach(async () => {
    accounts = { findByName: jest.fn() };
    convertClient = { convert: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetUserEngineDepositAddressEndpoint,
        { provide: AccountsCurrentRepository, useValue: accounts },
        { provide: HiveEngineConvertClient, useValue: convertClient },
      ],
    }).compile();

    endpoint = moduleRef.get(GetUserEngineDepositAddressEndpoint);
  });

  it('returns null when account is missing', async () => {
    accounts.findByName.mockResolvedValue(null);
    await expect(
      endpoint.execute('ghost', { symbol: 'HIVE' }),
    ).resolves.toBeNull();
  });

  it('returns hivepegged routing for HIVE deposits', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);

    const result = await endpoint.execute('alice', { symbol: 'HIVE' });

    expect(result?.symbol).toBe('HIVE');
    expect(result?.account).toBeTruthy();
    expect(result?.memo).toContain('buy');
    expect(convertClient.convert).not.toHaveBeenCalled();
  });

  it('uses converter client for non-HIVE deposits', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    convertClient.convert.mockResolvedValue({
      account: 'deposit-acct',
      memo: 'memo-123',
      address: '0xabc',
      pair: 'BTC/SWAP.BTC',
    });

    const result = await endpoint.execute('alice', { symbol: 'BTC' });

    expect(convertClient.convert).toHaveBeenCalledWith(
      expect.objectContaining({
        from_coin: 'BTC',
        destination: 'alice',
      }),
    );
    expect(result?.address).toBe('0xabc');
    expect(result?.memo).toBe('memo-123');
  });

  it('throws BadRequestException when converter fails', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    convertClient.convert.mockResolvedValue({ error: 'unsupported coin' });

    await expect(endpoint.execute('alice', { symbol: 'BTC' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
