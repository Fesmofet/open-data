import { ConfigService } from '@nestjs/config';

import { NOTIFICATIONS_BUFFER_MAX } from '../constants/notifications-buffer';
import { NotificationsSocketService } from './notifications-socket.service';
import { WaivioAuthSessionService } from './waivio-auth-session.service';

function ingestMessage(service: NotificationsSocketService, raw: string): void {
  (
    service as unknown as { handleMessage(raw: string): void }
  ).handleMessage(raw);
}

describe('NotificationsSocketService', () => {
  const config = {
    get: jest.fn(() => 'wss://example.test/notifications/ws'),
  } as unknown as ConfigService;

  const waivioAuth = {
    getStatus: jest.fn().mockReturnValue({ active: false }),
    getAccessToken: jest.fn(),
  } as unknown as WaivioAuthSessionService;

  it('returns empty status when disconnected', () => {
    const service = new NotificationsSocketService(config, waivioAuth);
    expect(service.getStatus()).toEqual({
      connected: false,
      bufferedCount: 0,
      lastEventAt: null,
      account: null,
    });
  });

  it('buffers only messaging notification types', async () => {
    const service = new NotificationsSocketService(config, waivioAuth);

    ingestMessage(
      service,
      JSON.stringify({
        event: 'notification',
        data: {
          id: '1',
          type: 'follow',
          occurredAt: '2026-01-01T00:00:00.000Z',
          blockNum: 1,
          payload: {},
        },
      }),
    );
    ingestMessage(
      service,
      JSON.stringify({
        event: 'notification',
        data: {
          id: '2',
          type: 'message_direct',
          occurredAt: '2026-01-01T00:00:01.000Z',
          blockNum: 2,
          actor: 'alice',
          payload: { channelId: 'dm-1' },
        },
      }),
    );

    const pulled = await service.pull({ limit: 10 });
    expect(pulled.items).toHaveLength(1);
    expect(pulled.items[0]?.type).toBe('message_direct');
    expect(service.getStatus().bufferedCount).toBe(0);
  });

  it('evicts oldest items when buffer exceeds max', async () => {
    const service = new NotificationsSocketService(config, waivioAuth);

    for (let i = 0; i < NOTIFICATIONS_BUFFER_MAX + 1; i += 1) {
      ingestMessage(
        service,
        JSON.stringify({
          event: 'notification',
          data: {
            id: `id-${i}`,
            type: 'message_group',
            occurredAt: '2026-01-01T00:00:00.000Z',
            blockNum: i,
            payload: { channelId: 'grp-1' },
          },
        }),
      );
    }

    expect(service.getStatus().bufferedCount).toBe(NOTIFICATIONS_BUFFER_MAX);
    const pulled = await service.pull({ limit: 1 });
    expect(pulled.items[0]?.id).toBe('id-1');
  });
});
