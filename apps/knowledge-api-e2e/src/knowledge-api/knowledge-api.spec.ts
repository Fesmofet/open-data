describe('POST /knowledge/mcp', () => {
  it('should list MCP tools', async () => {
    const res = await fetch(`${process.env.E2E_BASE_URL}/knowledge/mcp`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      result?: { tools?: { name: string }[] };
    };
    const names = (data.result?.tools ?? []).map((t) => t.name);
    expect(names).toContain('search_knowledge');
    expect(names).toContain('get_object_type');
  });
});
