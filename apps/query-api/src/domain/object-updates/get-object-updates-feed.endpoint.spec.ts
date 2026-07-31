import { DEFAULT_GOVERNANCE_SNAPSHOT } from '@opden-data-layer/objects-domain';

import { GetObjectUpdatesFeedEndpoint } from './get-object-updates-feed.endpoint';

describe('GetObjectUpdatesFeedEndpoint.executeByUpdateId', () => {
  const objectsCore = {
    findByObjectIdForPage: jest.fn(),
  };
  const updatesFeedRepo = {
    findJoinRowByObjectAndUpdateId: jest.fn(),
    findValidityVotesForObjectAndUpdates: jest.fn(),
    findWaivPowersByAccounts: jest.fn(),
  };
  const objectAuthorityRepo = {
    findByObjectId: jest.fn(),
  };
  const governanceResolver = {
    resolveMergedForObjectView: jest.fn(),
  };
  const config = {
    get: jest.fn(),
  };

  const endpoint = new GetObjectUpdatesFeedEndpoint(
    objectsCore as never,
    updatesFeedRepo as never,
    objectAuthorityRepo as never,
    governanceResolver as never,
    config as never,
  );

  const joinRow = {
    row: {
      update_id: 'u1',
      object_id: 'obj1',
      update_type: 'name',
      creator: 'alice',
      locale: null,
      created_at_unix: 100,
      value_text: 'Shop',
      value_json: null,
      value_geo: null,
      rank_score: null,
      rank_context: null,
      rank_decisive_event_seq: null,
      search_vector: null,
      value_text_normalized: null,
      transaction_id: 'tx1',
      event_seq: BigInt(1),
    },
    creator_wobjects_weight: 10,
    geo_lat: null,
    geo_lon: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    governanceResolver.resolveMergedForObjectView.mockResolvedValue(
      DEFAULT_GOVERNANCE_SNAPSHOT,
    );
    objectAuthorityRepo.findByObjectId.mockResolvedValue([]);
    updatesFeedRepo.findValidityVotesForObjectAndUpdates.mockResolvedValue([]);
    updatesFeedRepo.findWaivPowersByAccounts.mockResolvedValue(new Map());
    config.get.mockReturnValue(undefined);
  });

  it('returns null when object does not exist', async () => {
    objectsCore.findByObjectIdForPage.mockResolvedValue(null);

    await expect(
      endpoint.executeByUpdateId({ objectId: 'obj1', updateId: 'u1' }),
    ).resolves.toBeNull();
  });

  it('returns null when update does not exist for object', async () => {
    objectsCore.findByObjectIdForPage.mockResolvedValue({ object_id: 'obj1' });
    updatesFeedRepo.findJoinRowByObjectAndUpdateId.mockResolvedValue(null);

    await expect(
      endpoint.executeByUpdateId({ objectId: 'obj1', updateId: 'missing' }),
    ).resolves.toBeNull();
  });

  it('returns feed item dto when update exists', async () => {
    objectsCore.findByObjectIdForPage.mockResolvedValue({ object_id: 'obj1' });
    updatesFeedRepo.findJoinRowByObjectAndUpdateId.mockResolvedValue(joinRow);

    const result = await endpoint.executeByUpdateId({
      objectId: 'obj1',
      updateId: 'u1',
    });

    expect(result).toMatchObject({
      update_id: 'u1',
      object_id: 'obj1',
      update_type: 'name',
      creator: 'alice',
      value_text: 'Shop',
    });
    expect(updatesFeedRepo.findJoinRowByObjectAndUpdateId).toHaveBeenCalledWith(
      'obj1',
      'u1',
    );
  });
});
