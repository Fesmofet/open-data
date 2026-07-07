import { HiveEngineConvertClient } from './hive-engine-convert-client';

describe('HiveEngineConvertClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('POSTs to converter-api with a trailing slash', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: 'ltc-address',
        pair: 'LTC -> SWAP.LTC',
      }),
    });
    global.fetch = fetchMock as typeof fetch;

    const client = new HiveEngineConvertClient({
      baseUrl: 'https://converter-api.hive-engine.com/api/convert',
    });

    const result = await client.convert({
      from_coin: 'LTC',
      to_coin: 'SWAP.LTC',
      destination: 'alice',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://converter-api.hive-engine.com/api/convert/',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual({
      address: 'ltc-address',
      pair: 'LTC -> SWAP.LTC',
    });
  });

  it('returns API error message on failed convert', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        error: true,
        message: 'There is no such coin pair HIVE -> SWAP.HIVE',
      }),
    }) as typeof fetch;

    const client = new HiveEngineConvertClient({});
    const result = await client.convert({
      from_coin: 'HIVE',
      to_coin: 'SWAP.HIVE',
      destination: 'alice',
    });

    expect(result).toEqual({
      error: 'There is no such coin pair HIVE -> SWAP.HIVE',
    });
  });
});
