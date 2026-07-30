import type { RedisClientInterface } from '@opden-data-layer/clients';
import {
  NOTIFICATION_CONSUMER_GROUP,
  NOTIFICATION_STREAM_DATA_FIELD,
  NOTIFICATION_STREAM_KEY,
} from '../constants/notification-stream.constants';
import type { NotificationRouterService } from '../domain/notification-router.service';
import { RedisStreamNotificationConsumer } from './redis-stream.consumer';

type StreamEntry = { id: string; fields: Record<string, string> };

function processBatch(
  consumer: RedisStreamNotificationConsumer,
  entries: StreamEntry[],
): Promise<number> {
  return (
    consumer as unknown as {
      processBatch(e: StreamEntry[]): Promise<number>;
    }
  ).processBatch(entries);
}

function drainOwnPending(
  consumer: RedisStreamNotificationConsumer,
): Promise<void> {
  (consumer as unknown as { running: boolean }).running = true;
  return (
    consumer as unknown as { drainOwnPending(): Promise<void> }
  ).drainOwnPending();
}

function entry(id: string, event: unknown): StreamEntry {
  return {
    id,
    fields: { [NOTIFICATION_STREAM_DATA_FIELD]: JSON.stringify(event) },
  };
}

const trxProcessed = {
  type: 'trx_processed',
  occurredAt: '2026-01-01T00:00:00.000Z',
  blockNum: 1,
  trxId: 'trx-abc',
  objectId: null,
  actor: null,
  payload: {},
};

const follow = {
  type: 'follow',
  occurredAt: '2026-01-01T00:00:00.000Z',
  blockNum: 2,
  trxId: 't',
  objectId: null,
  actor: 'a',
  payload: { following: 'b', action: 'follow' },
};

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
    routeBatch: jest.fn().mockResolvedValue(undefined),
  } as unknown as NotificationRouterService;

  let consumer: RedisStreamNotificationConsumer;

  beforeEach(() => {
    jest.clearAllMocks();
    (router.routeBatch as jest.Mock).mockResolvedValue(undefined);
    (redis.xReadGroup as jest.Mock).mockResolvedValue([]);
    consumer = new RedisStreamNotificationConsumer(
      config,
      redisFactory,
      router,
    );
  });

  it('start creates the consumer group and drains pending without blocking', async () => {
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

  it('routes the whole batch in one call and acks every entry', async () => {
    const acked = await processBatch(consumer, [
      entry('1-0', trxProcessed),
      entry('2-0', follow),
    ]);

    expect(acked).toBe(2);
    expect(router.routeBatch).toHaveBeenCalledTimes(1);
    expect(router.routeBatch).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'trx_processed' }),
      expect.objectContaining({ type: 'follow' }),
    ]);
    expect(redis.xAck).toHaveBeenCalledWith(
      NOTIFICATION_STREAM_KEY,
      NOTIFICATION_CONSUMER_GROUP,
      '1-0',
      '2-0',
    );
  });

  it('skips unparsable entries but still acks them', async () => {
    const acked = await processBatch(consumer, [
      { id: '3-0', fields: {} },
      { id: '4-0', fields: { [NOTIFICATION_STREAM_DATA_FIELD]: '{bad' } },
      { id: '5-0', fields: { [NOTIFICATION_STREAM_DATA_FIELD]: '{"type":"nope"}' } },
    ]);

    expect(acked).toBe(3);
    expect(router.routeBatch).not.toHaveBeenCalled();
    expect(redis.xAck).toHaveBeenCalledWith(
      NOTIFICATION_STREAM_KEY,
      NOTIFICATION_CONSUMER_GROUP,
      '3-0',
      '4-0',
      '5-0',
    );
  });

  it('acks the batch after routing exhausts retries', async () => {
    (router.routeBatch as jest.Mock).mockRejectedValue(new Error('route failed'));

    const acked = await processBatch(consumer, [entry('6-0', follow)]);

    expect(acked).toBe(1);
    expect(router.routeBatch).toHaveBeenCalledTimes(2);
    expect(redis.xAck).toHaveBeenCalledWith(
      NOTIFICATION_STREAM_KEY,
      NOTIFICATION_CONSUMER_GROUP,
      '6-0',
    );
  });

  it('drainOwnPending acks recovered pending entries', async () => {
    (redis.xReadGroup as jest.Mock)
      .mockResolvedValueOnce([entry('9-0', trxProcessed)])
      .mockResolvedValueOnce([]);

    await drainOwnPending(consumer);

    expect(router.routeBatch).toHaveBeenCalled();
    expect(redis.xAck).toHaveBeenCalledWith(
      NOTIFICATION_STREAM_KEY,
      NOTIFICATION_CONSUMER_GROUP,
      '9-0',
    );
  });
});
