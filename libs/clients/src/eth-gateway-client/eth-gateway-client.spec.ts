import { Test } from '@nestjs/testing';

import { EthGatewayClient } from './eth-gateway-client';
import { ETH_GATEWAY_CLIENT_MODULE_OPTIONS } from './eth-gateway-client.options';

describe('EthGatewayClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns fee from gateway response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: 0.005 }),
    }) as never;

    const moduleRef = await Test.createTestingModule({
      providers: [
        EthGatewayClient,
        {
          provide: ETH_GATEWAY_CLIENT_MODULE_OPTIONS,
          useValue: { baseUrl: 'https://ethgw.hive-engine.com' },
        },
      ],
    }).compile();

    const client = moduleRef.get(EthGatewayClient);
    await expect(client.getSwapEthWithdrawalFee()).resolves.toBe(0.005);
  });

  it('returns null when gateway request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }) as never;

    const moduleRef = await Test.createTestingModule({
      providers: [
        EthGatewayClient,
        {
          provide: ETH_GATEWAY_CLIENT_MODULE_OPTIONS,
          useValue: {},
        },
      ],
    }).compile();

    const client = moduleRef.get(EthGatewayClient);
    await expect(client.getSwapEthWithdrawalFee()).resolves.toBeNull();
  });
});
