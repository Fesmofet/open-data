import type { RedisClientInterface } from '@opden-data-layer/clients';
import {
  NOTIFICATION_CONSUMER_GROUP,
  NOTIFICATION_STREAM_DATA_FIELD,
  NOTIFICATION_STREAM_KEY,
} from '../constants/notification-stream.constants';
import type { NotificationRouterService } from '../domain/notification-router.service';
import { RedisStreamNotificationConsumer } from './redis-stream.consumer';

function processEntry(
  consumer: RedisStreamNotificationConsumer,
  entryId: string,
  fields: Record<string, string>,
): Promise<string | null> {
  return (
    consumer as unknown as {
      processEntry(id: string, f: Record<string, string>): Promise<string | null>;
    }
  ).processEntry(entryId, fields);
}

function drainOwnPending(consumer: RedisStreamNotificationConsumer): Promise<void> {
  return (
    consumer as unknown as { drainOwnPending(): Promise<void> }
  ).drainOwnPending();
}

describe('RedisStreamNotificationConsumer', () => {
  const redis: RedisClientInterface = {
    xGroupCreate: jest.fn().mockResolvedValue(undefined),
    xReadGroup: jest.fn().mockResolvedValue([]),
    xAck: jest.fn().mockResolvedValue(1),
  } as unknown as RedisClientInterface;

  const redisFactory = {
    getClient: jest.fn(() => redis),
  } as unknown as import('@opden-data-layer/clients').RedisClientFactory;

  const config = {
    get: jest.fn((key: string) =>
      key === 'consumer.name' ? 'notifications-test' : undefined,
    ),
  } as unknown as import('@nestjs/config').ConfigService;

  const router = {
    route: jest.fn().mockResolvedValue(undefined),
  } as unknown as NotificationRouterService;

  let consumer: RedisStreamNotificationConsumer;

  beforeEach(() => {
    jest.clearAllMocks();
    (router.route as jest.Mock).mockResolvedValue(undefined);
    consumer = new RedisStreamNotificationConsumer(
      config,
      redisFactory,
      router,
    );
  });

  it('start creates consumer group and drains pending', async () => {
    await consumer.start();
    await consumer.stop();

    expect(redis.xGroupCreate).toHaveBeenCalledWith(
      NOTIFICATION_STREAM_KEY,
      NOTIFICATION_CONSUMER_GROUP,
      '$',
      true,
    );
    expect(redis.xReadGroup).toHaveBeenCalledWith(
      NOTIFICATION_CONSUMER_GROUP,
      'notifications-test',
      [{ key: NOTIFICATION_STREAM_KEY, id: '0' }],
      expect.objectContaining({ count: expect.any(Number) }),
    );
  });

  it('processEntry routes valid events and returns id for ack', async () => {
    const event = {
      type: 'trx_processed',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: 'trx-abc',
      objectId: null,
      actor: null,
      payload: {},
    };

    const ackId = await processEntry(consumer, '1-0', {
      [NOTIFICATION_STREAM_DATA_FIELD]: JSON.stringify(event),
    });

    expect(ackId).toBe('1-0');
    expect(router.route).toHaveBeenCalledWith(expect.objectContaining(event));
  });

  it('processEntry returns id for missing or invalid data without routing', async () => {
    expect(await processEntry(consumer, '2-0', {})).toBe('2-0');
    expect(router.route).not.toHaveBeenCalled();

    jest.clearAllMocks();

    expect(
      await processEntry(consumer, '3-0', {
        [NOTIFICATION_STREAM_DATA_FIELD]: '{bad',
      }),
    ).toBe('3-0');
    expect(router.route).not.toHaveBeenCalled();
  });

  it('processEntry acks after routing exhausts retries', async () => {
    (router.route as jest.Mock).mockRejectedValue(new Error('route failed'));

    const ackId = await processEntry(consumer, '4-0', {
      [NOTIFICATION_STREAM_DATA_FIELD]: JSON.stringify({
        type: 'follow',
        occurredAt: '2026-01-01T00:00:00.000Z',
        blockNum: 1,
        trxId: 't',
        objectId: null,
        actor: 'a',
        payload: { following: 'b', action: 'follow' },
      }),
    });

    expect(ackId).toBe('4-0');
    expect(router.route).toHaveBeenCalledTimes(2);
  });

  it('drainOwnPending acks recovered pending entries', async () => {
    const event = {
      type: 'trx_processed',
      occurredAt: '2026-01-01T00:00:00.000Z',
      blockNum: 1,
      trxId: 'trx-pending',
      objectId: null,
      actor: null,
      payload: {},
    };
    (redis.xReadGroup as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: '9-0',
          fields: {
            [NOTIFICATION_STREAM_DATA_FIELD]: JSON.stringify(event),
          },
        },
      ])
      .mockResolvedValueOnce([]);

    await drainOwnPending(consumer);

    expect(router.route).toHaveBeenCalled();
    expect(redis.xAck).toHaveBeenCalledWith(
      NOTIFICATION_STREAM_KEY,
      NOTIFICATION_CONSUMER_GROUP,
      '9-0',
    );
  });
});
