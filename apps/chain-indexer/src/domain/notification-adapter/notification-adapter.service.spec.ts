import { NotificationAdapterService } from './notification-adapter.service';
import type { ObjectNameResolverService } from './object-name-resolver.service';
import { InMemoryNotificationPublisher } from './publishers/in-memory.publisher';

describe('NotificationAdapterService', () => {
  let publisher: InMemoryNotificationPublisher;
  let objectNameResolver: { resolve: jest.Mock };
  let service: NotificationAdapterService;

  beforeEach(() => {
    publisher = new InMemoryNotificationPublisher();
    objectNameResolver = { resolve: jest.fn() };
    service = new NotificationAdapterService(
      publisher,
      objectNameResolver as unknown as ObjectNameResolverService,
    );
  });

  it('enriches update_vote_cast when objectName is null', async () => {
    objectNameResolver.resolve.mockResolvedValue('Test Business');

    await service.onNotification({
      type: 'update_vote_cast',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 100,
      trxId: 'trx-1',
      objectId: 'obj-1',
      actor: 'voter',
      payload: {
        updateId: 'upd-1',
        vote: 'for',
        updateType: 'name',
        objectName: null,
        authorPermlink: 'obj-1',
      },
    });

    expect(objectNameResolver.resolve).toHaveBeenCalledWith('obj-1');
    expect(publisher.published).toHaveLength(1);
    expect(publisher.published[0]).toMatchObject({
      type: 'update_vote_cast',
      payload: {
        objectName: 'Test Business',
        updateType: 'name',
      },
    });
  });

  it('enriches object_update when objectName is null', async () => {
    objectNameResolver.resolve.mockResolvedValue('Borkor Restaurant');

    await service.onNotification({
      type: 'object_update',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 100,
      trxId: 'trx-1',
      objectId: 'rcl-borkor',
      actor: 'alice',
      payload: {
        updateId: 'upd-1',
        updateType: 'description',
        objectName: null,
        authorPermlink: 'rcl-borkor',
      },
    });

    expect(objectNameResolver.resolve).toHaveBeenCalledWith('rcl-borkor');
    expect(publisher.published).toHaveLength(1);
    expect(publisher.published[0]).toMatchObject({
      type: 'object_update',
      payload: {
        objectName: 'Borkor Restaurant',
        authorPermlink: 'rcl-borkor',
      },
    });
  });

  it('publishes object_update unchanged when resolver returns null', async () => {
    objectNameResolver.resolve.mockResolvedValue(null);
    const event = {
      type: 'object_update' as const,
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 100,
      trxId: 'trx-1',
      objectId: 'rcl-borkor',
      actor: 'alice',
      payload: {
        updateId: 'upd-1',
        updateType: 'description',
        objectName: null,
        authorPermlink: 'rcl-borkor',
      },
    };

    await service.onNotification(event);

    expect(publisher.published[0]).toEqual(event);
  });
});
