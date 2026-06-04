import { safeFetch } from './safe-fetch';

describe('safeFetch', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns network failure when fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'));

    const result = await safeFetch('http://127.0.0.1:9/upload');

    expect(result).toEqual({ ok: false, failure: 'network' });
  });

  it('returns response when fetch succeeds', async () => {
    const response = new Response('ok', { status: 200 });
    global.fetch = jest.fn().mockResolvedValue(response);

    const result = await safeFetch('http://example.com/upload');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.response).toBe(response);
    }
  });
});
