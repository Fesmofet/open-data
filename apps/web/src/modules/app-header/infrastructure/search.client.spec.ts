import {
  fetchSearchObjectById,
  fetchSearchObjectsByIds,
  pickSearchObjectById,
  pickSearchUserByName,
} from './search.client';
import type { SearchObjectResult } from '../domain/search-response.schema';
import type { SearchUserResult } from '../domain/search-response.schema';

function obj(
  partial: Partial<SearchObjectResult> & Pick<SearchObjectResult, 'object_id'>,
): SearchObjectResult {
  return {
    object_type: 'recipe',
    name: 'Vegan bowl',
    image_url: null,
    parent_name: null,
    ...partial,
  };
}

function user(partial: Partial<SearchUserResult> & Pick<SearchUserResult, 'name'>): SearchUserResult {
  return {
    profile_image: null,
    reputation: 1,
    wobjects_weight: 0,
    followers_count: 0,
    is_following: false,
    ...partial,
  };
}

describe('pickSearchUserByName', () => {
  it('returns exact account match case-insensitively', () => {
    const hit = user({ name: 'alice', profile_image: 'https://example.com/a.jpg' });
    expect(pickSearchUserByName([user({ name: 'bob' }), hit], 'Alice')).toEqual(hit);
  });
});

describe('fetchSearchObjectsByIds', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as typeof fetch;
  });

  it('POSTs object_ids to the BFF batch route', async () => {
    const hit = obj({
      object_id: 'food',
      object_type: 'hashtag',
      image_url: 'https://example.com/food.jpg',
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ objects: [hit] }),
    });

    const result = await fetchSearchObjectsByIds(['food', '  ']);

    expect(fetchMock).toHaveBeenCalledWith('/api/search/objects-by-ids', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ object_ids: ['food'] }),
      cache: 'no-store',
      signal: undefined,
    });
    expect(result).toEqual([hit]);
  });

  it('returns null when the batch request fails', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    expect(await fetchSearchObjectsByIds(['x'])).toBeNull();
  });
});

describe('fetchSearchObjectById', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as typeof fetch;
  });

  it('uses batch by-id API and returns exact match', async () => {
    const hit = obj({
      object_id: 'waivio/cafe',
      object_type: 'restaurant',
      image_url: 'https://example.com/cafe.jpg',
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ objects: [hit] }),
    });

    await expect(fetchSearchObjectById('waivio/cafe')).resolves.toEqual(hit);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('pickSearchObjectById', () => {
  it('returns exact id match', () => {
    const hit = obj({ object_id: 'abc-vegan', name: 'Vegan' });
    expect(
      pickSearchObjectById(
        [obj({ object_id: 'other' }), hit],
        'abc-vegan',
      ),
    ).toEqual(hit);
  });

  it('filters by appliesTo', () => {
    const hit = obj({ object_id: 'x-1', object_type: 'recipe' });
    expect(
      pickSearchObjectById([hit], 'x-1', ['business']),
    ).toBeNull();
  });
});
