import { TelegramApiClient } from './telegram-api.client';

describe('TelegramApiClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns retryable result when sendMessage fetch fails', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('fetch failed')) as typeof fetch;

    const client = new TelegramApiClient('test-token');
    const result = await client.sendMessage('42', 'hello');

    expect(result).toEqual({
      ok: false,
      errorCode: 0,
      description: 'fetch failed',
    });
  });

  it('returns empty updates when getUpdates fetch fails', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('fetch failed')) as typeof fetch;

    const client = new TelegramApiClient('test-token');
    await expect(client.getUpdates(undefined, 10)).resolves.toEqual([]);
  });
});
