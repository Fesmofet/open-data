import { ObjectFavoriteReputationService } from './object-favorite-reputation.service';

describe('ObjectFavoriteReputationService', () => {
  function createService(mocks: {
    exists?: jest.Mock;
    hasFavoriteByAccountForCreator?: jest.Mock;
    adjustObjectReputation?: jest.Mock;
  }) {
    return new ObjectFavoriteReputationService(
      {
        exists: mocks.exists ?? jest.fn().mockResolvedValue(false),
        hasFavoriteByAccountForCreator:
          mocks.hasFavoriteByAccountForCreator ?? jest.fn().mockResolvedValue(false),
      } as unknown as import('../../repositories').ObjectFavoriteRepository,
      {
        adjustObjectReputation:
          mocks.adjustObjectReputation ?? jest.fn().mockResolvedValue(undefined),
      } as unknown as import('../../repositories').AccountsCurrentRepository,
    );
  }

  it('onFavoriteAdded skips self-favorite', async () => {
    const adjustObjectReputation = jest.fn();
    const service = createService({ adjustObjectReputation });

    await service.onFavoriteAdded('obj-1', 'alice', 'alice');

    expect(adjustObjectReputation).not.toHaveBeenCalled();
  });

  it('onFavoriteAdded increments creator on first favorite by account', async () => {
    const adjustObjectReputation = jest.fn().mockResolvedValue(undefined);
    const service = createService({ adjustObjectReputation });

    await service.onFavoriteAdded('obj-1', 'fan', 'creator');

    expect(adjustObjectReputation).toHaveBeenCalledWith('creator', 1);
  });

  it('onFavoriteAdded skips increment when favorite row already exists', async () => {
    const adjustObjectReputation = jest.fn();
    const service = createService({
      exists: jest.fn().mockResolvedValue(true),
      adjustObjectReputation,
    });

    await service.onFavoriteAdded('obj-1', 'fan', 'creator');

    expect(adjustObjectReputation).not.toHaveBeenCalled();
  });

  it('onFavoriteRemoved decrements creator when no other favorites remain', async () => {
    const adjustObjectReputation = jest.fn().mockResolvedValue(undefined);
    const hasFavoriteByAccountForCreator = jest.fn().mockResolvedValue(false);
    const service = createService({ adjustObjectReputation, hasFavoriteByAccountForCreator });

    await service.onFavoriteRemoved('obj-1', 'fan', 'creator');

    expect(hasFavoriteByAccountForCreator).toHaveBeenCalledWith('fan', 'creator', 'obj-1');
    expect(adjustObjectReputation).toHaveBeenCalledWith('creator', -1);
  });
});
