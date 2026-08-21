import {
  GetObjectFieldReferencesByTypeEndpoint,
  GetObjectFieldReferencesSummaryEndpoint,
  ObjectFieldReferenceSourceError,
} from './get-object-field-references.endpoint';

describe('GetObjectFieldReferencesSummaryEndpoint', () => {
  const governance = { platform: {}, merged: {} } as never;

  function makeEndpoint(deps: {
    core: { findByObjectIdForPage: jest.Mock };
    fieldReferencesRepo: { findReferencingObjectIds: jest.Mock };
    governanceResolver: { resolveMergedForObjectView: jest.Mock };
    authorityRepo: { findFavoriteObjectIdsForAccount: jest.Mock };
    aggregated: { loadByObjectIds: jest.Mock };
    viewService: { resolve: jest.Mock };
  }) {
    const listItemsRecursiveCountService = {
      countForListRefIds: jest.fn().mockResolvedValue(new Map()),
    };
    const config = { get: jest.fn().mockReturnValue('https://ipfs.io') };

    return new GetObjectFieldReferencesSummaryEndpoint(
      { findByObjectIdForPage: deps.core.findByObjectIdForPage } as never,
      { loadByObjectIds: deps.aggregated.loadByObjectIds } as never,
      deps.viewService as never,
      deps.governanceResolver as never,
      deps.authorityRepo as never,
      listItemsRecursiveCountService as never,
      deps.fieldReferencesRepo as never,
      config as never,
    );
  }

  it('returns null when object is missing', async () => {
    const endpoint = makeEndpoint({
      core: { findByObjectIdForPage: jest.fn().mockResolvedValue(null) },
      fieldReferencesRepo: { findReferencingObjectIds: jest.fn() },
      governanceResolver: { resolveMergedForObjectView: jest.fn() },
      authorityRepo: { findFavoriteObjectIdsForAccount: jest.fn() },
      aggregated: { loadByObjectIds: jest.fn() },
      viewService: { resolve: jest.fn() },
    });

    const result = await endpoint.execute('missing', { limit: 6 }, 'en-US');
    expect(result).toBeNull();
  });

  it('throws when source type does not support field references', async () => {
    const endpoint = makeEndpoint({
      core: {
        findByObjectIdForPage: jest.fn().mockResolvedValue({
          object_id: 'book-1',
          object_type: 'book',
        }),
      },
      fieldReferencesRepo: { findReferencingObjectIds: jest.fn() },
      governanceResolver: { resolveMergedForObjectView: jest.fn() },
      authorityRepo: { findFavoriteObjectIdsForAccount: jest.fn() },
      aggregated: { loadByObjectIds: jest.fn() },
      viewService: { resolve: jest.fn() },
    });

    await expect(endpoint.execute('book-1', { limit: 6 }, 'en-US')).rejects.toBeInstanceOf(
      ObjectFieldReferenceSourceError,
    );
  });

  it('returns grouped previews for person sources', async () => {
    const endpoint = makeEndpoint({
      core: {
        findByObjectIdForPage: jest.fn().mockResolvedValue({
          object_id: 'alice',
          object_type: 'person',
        }),
      },
      fieldReferencesRepo: {
        findReferencingObjectIds: jest.fn().mockResolvedValue(['book-1']),
      },
      governanceResolver: {
        resolveMergedForObjectView: jest.fn().mockResolvedValue(governance),
      },
      authorityRepo: { findFavoriteObjectIdsForAccount: jest.fn() },
      aggregated: {
        loadByObjectIds: jest.fn().mockResolvedValue({
          objects: [
            {
              core: { object_id: 'book-1', object_type: 'book', weight: 1 },
              updates: [],
            },
          ],
          voterWaivPowers: new Map(),
          rankVoteProjection: {},
        }),
      },
      viewService: {
        resolve: jest.fn().mockReturnValue([
          {
            object_id: 'book-1',
            fields: { name: { values: [{ validity_status: 'VALID', value_text: 'Book' }] } },
          },
        ]),
      },
    });

    const result = await endpoint.execute('alice', { limit: 6 }, 'en-US');
    expect(result?.groups).toHaveLength(1);
    expect(result?.groups[0]?.objectType).toBe('book');
    expect(result?.groups[0]?.items[0]?.object_id).toBe('book-1');
  });
});

describe('GetObjectFieldReferencesByTypeEndpoint', () => {
  it('rejects invalid reference object type for source', async () => {
    const endpoint = new GetObjectFieldReferencesByTypeEndpoint(
      {
        findByObjectIdForPage: jest.fn().mockResolvedValue({
          object_id: 'biz',
          object_type: 'business',
        }),
      } as never,
      { loadByObjectIds: jest.fn() } as never,
      { resolve: jest.fn() } as never,
      { resolveMergedForObjectView: jest.fn() } as never,
      { findFavoriteObjectIdsForAccount: jest.fn() } as never,
      { countForListRefIds: jest.fn() } as never,
      { findReferencingObjectIds: jest.fn() } as never,
      { get: jest.fn() } as never,
    );

    await expect(
      endpoint.executeByType('biz', 'person', { limit: 20 }, 'en-US'),
    ).rejects.toBeInstanceOf(ObjectFieldReferenceSourceError);
  });
});
