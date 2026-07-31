import { ConfigService } from '@nestjs/config';
import type { RedisClientInterface } from '@opden-data-layer/clients';
import { TelegramNotificationService } from './telegram-notification.service';
import {
  TELEGRAM_STREAM_DATA_FIELD,
  TELEGRAM_STREAM_KEY,
} from '../constants/telegram.constants';

describe('TelegramNotificationService', () => {
  const redis: RedisClientInterface = {
    pipeline: jest.fn(() => ({
      xAdd: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(undefined),
    })),
  } as unknown as RedisClientInterface;

  const redisFactory = {
    getClient: jest.fn(() => redis),
  };

  const config = {
    get: jest.fn((key: string) => {
      if (key === 'telegram.botToken') {
        return 'token';
      }
      if (key === 'telegram.webPublicOrigin') {
        return 'https://waiviodev.com';
      }
      return undefined;
    }),
  } as unknown as ConfigService;

  let service: TelegramNotificationService;
  let xAdd: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    xAdd = jest.fn().mockReturnThis();
    (redis.pipeline as jest.Mock).mockReturnValue({
      xAdd,
      exec: jest.fn().mockResolvedValue(undefined),
    });
    service = new TelegramNotificationService(config, redisFactory as never);
  });

  it('queues telegram body without raw URL and stores websiteUrl separately', async () => {
    await service.enqueueMany([
      {
        account: 'flowmaster',
        chatIds: ['42'],
        itemId: 'item-1',
        event: {
          type: 'transfer_in',
          occurredAt: '2026-07-30T12:00:00Z',
          blockNum: 1,
          trxId: 't',
          objectId: null,
          actor: 'wiv01',
          payload: {
            from: 'wiv01',
            to: 'flowmaster',
            amount: '0.001',
            symbol: 'HIVE',
            memo: null,
          },
        },
      },
    ]);

    expect(xAdd).toHaveBeenCalledWith(
      TELEGRAM_STREAM_KEY,
      expect.objectContaining({
        [TELEGRAM_STREAM_DATA_FIELD]: expect.any(String),
      }),
    );
    const payload = JSON.parse(
      xAdd.mock.calls[0][1][TELEGRAM_STREAM_DATA_FIELD],
    );
    expect(payload.text).toBe('wiv01 transferred 0.001 HIVE to flowmaster');
    expect(payload.text).not.toContain('https://');
    expect(payload.websiteUrl).toBe(
      'https://waiviodev.com/@flowmaster/transfers?type=transfer',
    );
  });

  it('uses explicit recipient account instead of you/your', async () => {
    await service.enqueueMany([
      {
        account: 'flowmaster',
        chatIds: ['42'],
        itemId: 'item-2',
        event: {
          type: 'reply',
          occurredAt: '2026-07-30T12:00:00Z',
          blockNum: 1,
          trxId: 't',
          objectId: null,
          actor: 'w7ngc',
          payload: {
            author: 'w7ngc',
            permlink: 'c1',
            parentAuthor: 'flowmaster',
            parentPermlink: 'p1',
            isRootPost: false,
            isReplyToComment: true,
          },
        },
      },
      {
        account: 'flowmaster',
        chatIds: ['42'],
        itemId: 'item-3',
        event: {
          type: 'my_comment',
          occurredAt: '2026-07-30T12:00:00Z',
          blockNum: 1,
          trxId: 't2',
          objectId: null,
          actor: 'flowmaster',
          payload: {
            author: 'flowmaster',
            permlink: 'c2',
            parentAuthor: 'w95hj',
          },
        },
      },
    ]);

    const replyPayload = JSON.parse(
      xAdd.mock.calls[0][1][TELEGRAM_STREAM_DATA_FIELD],
    );
    expect(replyPayload.text).toBe(
      "w7ngc has replied to flowmaster's comment",
    );
    expect(replyPayload.text).not.toMatch(/\b(you|your)\b/i);

    const myCommentPayload = JSON.parse(
      xAdd.mock.calls[1][1][TELEGRAM_STREAM_DATA_FIELD],
    );
    expect(myCommentPayload.text).toBe('flowmaster replied to w95hj');
    expect(myCommentPayload.text).not.toMatch(/\b(you|your)\b/i);
  });

  it('queues update_vote_cast with update detail websiteUrl', async () => {
    await service.enqueueMany([
      {
        account: 'owner',
        chatIds: ['42'],
        itemId: 'item-vote',
        event: {
          type: 'update_vote_cast',
          occurredAt: '2026-07-30T12:00:00Z',
          blockNum: 1,
          trxId: 't',
          objectId: 'obj-1',
          actor: 'flowmaster',
          payload: {
            updateId: 'upd-1',
            vote: 'for',
            updateType: 'pin',
            objectName: 'test business all',
            authorPermlink: 'obj-1',
          },
        },
      },
    ]);

    const payload = JSON.parse(
      xAdd.mock.calls[0][1][TELEGRAM_STREAM_DATA_FIELD],
    );
    expect(payload.text).toBe(
      'flowmaster approved the pin for test business all',
    );
    expect(payload.websiteUrl).toBe(
      'https://waiviodev.com/object/obj-1/updates/upd-1',
    );
  });
});
