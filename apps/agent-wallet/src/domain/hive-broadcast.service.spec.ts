import {
  WalletAccountsService,
  WalletStatusService,
} from './hive-broadcast.service';
import type { HasSessionService } from './has-session.service';
import type { HiveBroadcastService } from './hive-broadcast.service';
import type { LocalKeysService } from './local-keys.service';
import type { NotificationsSocketService } from './notifications-socket.service';
import type { WaivioAuthSessionService } from './waivio-auth-session.service';

describe('WalletStatusService', () => {
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'waivioApiOrigin') {
        return 'https://waiviodev.com';
      }
      if (key === 'defaultAccount') {
        return 'alice';
      }
      if (key === 'accountsSource') {
        return 'file';
      }
      return undefined;
    }),
  };

  const hasSession = {
    getSessionInfo: jest.fn().mockReturnValue(null),
  } as unknown as HasSessionService;

  const waivioAuth = {
    getDefaultStatus: jest.fn().mockReturnValue({ active: false }),
  } as unknown as WaivioAuthSessionService;

  const localKeys = {
    isMemoReady: jest.fn().mockReturnValue(true),
    getReadiness: jest.fn().mockReturnValue({
      account: 'alice',
      ready: true,
      postingReady: true,
      activeReady: false,
      memoReady: true,
      ownerReady: false,
    }),
    getAllReadiness: jest.fn().mockReturnValue([
      {
        account: 'alice',
        ready: true,
        postingReady: true,
        activeReady: false,
        memoReady: true,
        ownerReady: false,
      },
      {
        account: 'bob',
        ready: true,
        postingReady: true,
        activeReady: true,
        memoReady: false,
        ownerReady: false,
      },
    ]),
  } as unknown as LocalKeysService;

  const broadcast = {
    getSigningMode: jest.fn().mockReturnValue('local'),
  } as unknown as HiveBroadcastService;

  it('returns localAccounts without secrets', () => {
    const service = new WalletStatusService(
      config as never,
      hasSession,
      waivioAuth,
      localKeys,
      broadcast,
    );

    const status = service.getStatus();
    expect(status.localAccounts).toHaveLength(2);
    expect(status.defaultAccount).toBe('alice');
    expect(status.accountsSource).toBe('file');
    expect(JSON.stringify(status)).not.toMatch(/5J[A-Za-z0-9]+/);
  });
});

describe('WalletAccountsService', () => {
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'defaultAccount') {
        return 'alice';
      }
      if (key === 'accountsSource') {
        return 'file';
      }
      if (key === 'accounts') {
        return [
          { account: 'alice', keys: { posting: '5Ja' } },
          { account: 'bob', keys: { posting: '5Jb' } },
        ];
      }
      return undefined;
    }),
  };

  const localKeys = {
    getAllReadiness: jest.fn().mockReturnValue([
      {
        account: 'alice',
        ready: true,
        postingReady: true,
        activeReady: false,
        memoReady: true,
        ownerReady: false,
      },
      {
        account: 'bob',
        ready: true,
        postingReady: true,
        activeReady: true,
        memoReady: false,
        ownerReady: false,
      },
    ]),
    listAccounts: jest.fn().mockReturnValue(['alice', 'bob']),
  } as unknown as LocalKeysService;

  const waivioAuth = {
    getStatus: jest.fn((account: string) =>
      account === 'alice'
        ? { active: true, provider: 'keychain' as const }
        : { active: false },
    ),
  } as unknown as WaivioAuthSessionService;

  const notificationsSocket = {
    isConnected: jest.fn((account: string) => account === 'alice'),
  } as unknown as NotificationsSocketService;

  it('lists registry accounts with readiness and no secrets', () => {
    const service = new WalletAccountsService(
      config as never,
      localKeys,
      waivioAuth,
      notificationsSocket,
    );

    const result = service.getAccounts();
    expect(result.accounts).toHaveLength(2);
    expect(result.accounts[0]).toMatchObject({
      account: 'alice',
      postingReady: true,
      waivioAuth: { active: true, provider: 'keychain' },
      notifications: { connected: true },
    });
    expect(result.accounts[1]).toMatchObject({
      account: 'bob',
      activeReady: true,
      waivioAuth: { active: false },
      notifications: { connected: false },
    });
    expect(JSON.stringify(result)).not.toMatch(/5J[A-Za-z0-9]+/);
  });
});
