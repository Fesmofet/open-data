import { Test } from '@nestjs/testing';

import { AccountsCurrentRepository } from '../../repositories';
import { EngineWithdrawQuoteService } from './engine-swap/engine-withdraw-quote.service';
import { PostUserEngineWithdrawQuoteEndpoint } from './post-user-engine-withdraw-quote.endpoint';

describe('PostUserEngineWithdrawQuoteEndpoint', () => {
  let endpoint: PostUserEngineWithdrawQuoteEndpoint;
  let accounts: jest.Mocked<Pick<AccountsCurrentRepository, 'findByName'>>;
  let withdrawQuote: jest.Mocked<Pick<EngineWithdrawQuoteService, 'quote'>>;

  beforeEach(async () => {
    accounts = { findByName: jest.fn() };
    withdrawQuote = { quote: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PostUserEngineWithdrawQuoteEndpoint,
        { provide: AccountsCurrentRepository, useValue: accounts },
        { provide: EngineWithdrawQuoteService, useValue: withdrawQuote },
      ],
    }).compile();

    endpoint = moduleRef.get(PostUserEngineWithdrawQuoteEndpoint);
  });

  it('returns null when account is missing', async () => {
    accounts.findByName.mockResolvedValue(undefined);
    await expect(
      endpoint.execute('ghost', {
        inputSymbol: 'WAIV',
        outputSymbol: 'HIVE',
        quantity: '1',
        previewOnly: false,
      }),
    ).resolves.toBeNull();
  });

  it('passes through quote result including errorCode', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' } as never);
    withdrawQuote.quote.mockResolvedValue({
      predictiveAmount: null,
      customJsonPayload: [],
      error: 'gas fee 0.5',
      errorCode: 'eth_gas_fee',
      errorParams: { fee: 0.5 },
    });

    const result = await endpoint.execute('alice', {
      inputSymbol: 'WAIV',
      outputSymbol: 'ETH',
      quantity: '3',
      previewOnly: true,
    });

    expect(result?.errorCode).toBe('eth_gas_fee');
    expect(result?.errorParams).toEqual({ fee: 0.5 });
    expect(withdrawQuote.quote).toHaveBeenCalledWith(
      expect.objectContaining({
        previewOnly: true,
        inputSymbol: 'WAIV',
        outputSymbol: 'ETH',
      }),
    );
  });
});
