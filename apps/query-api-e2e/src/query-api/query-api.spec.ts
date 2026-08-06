describe('GET /query/v1/docs', () => {
  it('should serve OpenAPI UI', async () => {
    const res = await fetch(`${process.env.E2E_BASE_URL}/query/v1/docs`);

    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type') ?? '';
    expect(contentType).toContain('text/html');
  });
});

describe('POST /query/v1/posts/feed', () => {
  it('returns paginated home feed for guest', async () => {
    const res = await fetch(`${process.env.E2E_BASE_URL}/query/v1/posts/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 5, currency: 'USD' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: unknown[];
      cursor: string | null;
      hasMore: boolean;
    };
    expect(Array.isArray(body.items)).toBe(true);
    expect(typeof body.hasMore).toBe('boolean');
    expect(body.cursor === null || typeof body.cursor === 'string').toBe(true);
  });
});
