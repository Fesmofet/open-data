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
    expect(payload.text).toBe('wiv01 transferred 0.001 HIVE to you');
    expect(payload.text).not.toContain('https://');
    expect(payload.websiteUrl).toBe(
      'https://waiviodev.com/@flowmaster/transfers?type=transfer',
    );
  });
});
