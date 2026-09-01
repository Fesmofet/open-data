/** @jest-environment node */

jest.mock('server-only', () => ({}));

const mockEnv = {
  QUERY_API_URL: 'http://query-api.test',
};

jest.mock('@/config/env', () => ({
  env: mockEnv,
}));

import { NextRequest } from 'next/server';

import { GET } from './route';

describe('GET /api/discover/tag-categories', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('forwards box to query-api', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ categories: [] }),
      headers: { get: () => 'application/json' },
    }) as typeof fetch;

    const request = new NextRequest(
      'http://localhost/api/discover/tag-categories?object_type=restaurant&box=-123.2,49.1,-123.0,49.3',
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const upstreamUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(upstreamUrl).toContain('/query/v1/discover/tag-categories');
    expect(upstreamUrl).toContain('object_type=restaurant');
    expect(upstreamUrl).toContain('box=-123.2%2C49.1%2C-123.0%2C49.3');
  });

  it('returns 400 when object_type is missing', async () => {
    global.fetch = jest.fn() as typeof fetch;

    const request = new NextRequest(
      'http://localhost/api/discover/tag-categories?box=-123.2,49.1,-123.0,49.3',
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
