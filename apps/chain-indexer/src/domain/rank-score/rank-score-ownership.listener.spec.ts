import { RankScoreOwnershipListener } from './rank-score-ownership.listener';
import { RankScoreService } from './rank-score.service';
import { OwnershipChangedEvent } from '../odl-parser/ownership-changed.event';

describe('RankScoreOwnershipListener', () => {
  it('recalculates ranks for the object on ownership change', async () => {
    const recalculateForObjectId = jest.fn().mockResolvedValue(undefined);
    const listener = new RankScoreOwnershipListener({
      recalculateForObjectId,
    } as unknown as RankScoreService);

    await listener.handleOwnershipChanged(new OwnershipChangedEvent('alice', 'obj-1'));

    expect(recalculateForObjectId).toHaveBeenCalledWith('obj-1');
  });

  it('does not call service when objectId is blank', async () => {
    const recalculateForObjectId = jest.fn().mockResolvedValue(undefined);
    const listener = new RankScoreOwnershipListener({
      recalculateForObjectId,
    } as unknown as RankScoreService);

    await listener.handleOwnershipChanged(new OwnershipChangedEvent('alice', '   '));

    expect(recalculateForObjectId).not.toHaveBeenCalled();
  });
});
