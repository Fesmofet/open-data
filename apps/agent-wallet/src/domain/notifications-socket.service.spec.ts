const wsInstances: Array<{ url: string }> = [];

jest.mock('ws', () => ({
  __esModule: true,
  default: class MockWebSocket {
    static OPEN = 1;
    readyState = 0;
    url: string;

    constructor(url: string) {
      this.url = url;
      wsInstances.push(this);
    }

    on(event: string, cb: () => void): void {
      if (event === 'open') {
        queueMicrotask(() => {
          this.readyState = MockWebSocket.OPEN;
          cb();
        });
      }
    }

    close(): void {
      this.readyState = 3;
    }
  },
}));

import { ConfigService } from '@nestjs/config';

import { NOTIFICATIONS_BUFFER_MAX } from '../constants/notifications-buffer';
import { NotificationsSocketService } from './notifications-socket.service';
import { WaivioAuthSessionService } from './waivio-auth-session.service';

function ingestMessage(
  service: NotificationsSocketService,
  account: string,
  raw: string,
): void {
  (
    service as unknown as { handleMessage(account: string, raw: string): void }
  ).handleMessage(account, raw);
}

describe('NotificationsSocketService', () => {
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'notificationsWsUrl') {
        return 'wss://example.test/notifications/ws';
      }
      if (key === 'defaultAccount') {
        return 'alice';
      }
      return undefined;
    }),
  } as unknown as ConfigService;

  const waivioAuth = {
    getStatus: jest.fn().mockReturnValue({ active: false }),
    getAllStatuses: jest.fn().mockReturnValue([]),
    getAccessToken: jest.fn(),
  } as unknown as WaivioAuthSessionService;

  beforeEach(() => {
    wsInstances.length = 0;
    jest.clearAllMocks();
  });

  it('returns empty status when disconnected', () => {
    const service = new NotificationsSocketService(config, waivioAuth);
    expect(service.getStatus()).toEqual({
      connected: false,
      bufferedCount: 0,
      lastEventAt: null,
      account: 'alice',
      connections: [],
    });
  });

  it('buffers only messaging notification types and tags account', async () => {
    const service = new NotificationsSocketService(config, waivioAuth);

    ingestMessage(
      service,
      'bob',
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
      'bob',
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
    expect(pulled.items[0]?.account).toBe('bob');
    expect(service.getStatus().bufferedCount).toBe(0);
  });

  it('filters pull results by account without dropping other accounts', async () => {
    const service = new NotificationsSocketService(config, waivioAuth);

    for (const account of ['alice', 'bob']) {
      ingestMessage(
        service,
        account,
        JSON.stringify({
          event: 'notification',
          data: {
            id: account,
            type: 'message_direct',
            occurredAt: '2026-01-01T00:00:00.000Z',
            blockNum: 1,
            payload: {},
          },
        }),
      );
    }

    const aliceItems = await service.pull({ limit: 10, account: 'alice' });
    expect(aliceItems.items).toHaveLength(1);
    expect(aliceItems.items[0]?.account).toBe('alice');

    const bobItems = await service.pull({ limit: 10, account: 'bob' });
    expect(bobItems.items).toHaveLength(1);
    expect(bobItems.items[0]?.account).toBe('bob');
  });

  it('returns notifications from all accounts when pull has no account filter', async () => {
    const service = new NotificationsSocketService(config, waivioAuth);

    for (const account of ['alice', 'bob']) {
      ingestMessage(
        service,
        account,
        JSON.stringify({
          event: 'notification',
          data: {
            id: account,
            type: 'message_direct',
            occurredAt: '2026-01-01T00:00:00.000Z',
            blockNum: 1,
            payload: {},
          },
        }),
      );
    }

    const pulled = await service.pull({ limit: 10 });
    expect(pulled.items).toHaveLength(2);
    expect(new Set(pulled.items.map((item) => item.account))).toEqual(
      new Set(['alice', 'bob']),
    );
  });

  it('refreshConnections opens one socket per active account with distinct tokens', async () => {
    const waivioAuthMulti = {
      getStatus: jest.fn((account: string) => ({
        active: account === 'alice' || account === 'bob',
      })),
      getAllStatuses: jest.fn().mockReturnValue([
        { active: true, account: 'alice' },
        { active: true, account: 'bob' },
      ]),
      getAccessToken: jest.fn((account: string) =>
        Promise.resolve(`token-${account}`),
      ),
    } as unknown as WaivioAuthSessionService;

    const service = new NotificationsSocketService(config, waivioAuthMulti);
    await service.refreshConnections();

    expect(wsInstances).toHaveLength(2);
    expect(wsInstances.map((ws) => ws.url)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('token-alice'),
        expect.stringContaining('token-bob'),
      ]),
    );
    expect(service.isConnected('alice')).toBe(true);
    expect(service.isConnected('bob')).toBe(true);
  });

  it('evicts oldest items when buffer exceeds max', async () => {
    const service = new NotificationsSocketService(config, waivioAuth);

    for (let i = 0; i < NOTIFICATIONS_BUFFER_MAX + 1; i += 1) {
      ingestMessage(
        service,
        'alice',
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
