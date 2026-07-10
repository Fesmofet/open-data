jest.mock('server-only', () => ({}));

jest.mock('@/modules/user-profile/infrastructure/clients/query-api.client', () => ({
  queryApiFetch: jest.fn(),
}));

import { queryApiFetch } from '@/modules/user-profile/infrastructure/clients/query-api.client';

import { fetchCategoryObjects } from './category-objects.client';

const queryApiFetchMock = queryApiFetch as jest.MockedFunction<typeof queryApiFetch>;

describe('fetchCategoryObjects', () => {
  beforeEach(() => {
    queryApiFetchMock.mockReset();
  });

  it('returns null for blank name', async () => {
    await expect(fetchCategoryObjects({ name: '  ', limit: 20 })).resolves.toBeNull();
    expect(queryApiFetchMock).not.toHaveBeenCalled();
  });

  it('coerces string weight in response items', async () => {
    queryApiFetchMock.mockResolvedValue({
      items: [
        {
          object_id: 'o1',
          object_type: 'product',
          fields: { name: 'One' },
          weight: '3.5',
        },
      ],
      hasMore: false,
      cursor: null,
    });

    const page = await fetchCategoryObjects({ name: 'Skirts', limit: 20 });
    expect(page?.items).toHaveLength(1);
    expect(page?.items[0]?.object_id).toBe('o1');
  });

  it('returns null when response fails schema validation', async () => {
    queryApiFetchMock.mockResolvedValue({
      items: [{ object_id: 'o1' }],
      hasMore: false,
      cursor: null,
    });

    await expect(fetchCategoryObjects({ name: 'Skirts', limit: 20 })).resolves.toBeNull();
  });
});
