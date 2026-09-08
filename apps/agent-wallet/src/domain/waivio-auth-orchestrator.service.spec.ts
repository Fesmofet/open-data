import { PendingRequestsStore } from './pending-requests.store';
import { WaivioAuthOrchestratorService } from './waivio-auth-orchestrator.service';
import type { HasSessionService } from './has-session.service';
import type { LocalKeysService } from './local-keys.service';
import type { NotificationsSocketService } from './notifications-socket.service';
import type { WalletSignerResolverService } from './wallet-signer-resolver.service';
import type { WaivioAuthClientService } from './waivio-auth-client.service';
import type { WaivioAuthSessionService } from './waivio-auth-session.service';

describe('WaivioAuthOrchestratorService', () => {
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'defaultAccount') {
        return 'alice';
      }
      return undefined;
    }),
  };

  const pending = new PendingRequestsStore();

  const getStatus = jest.fn();
  const logout = jest.fn().mockResolvedValue(undefined);
  const waivioSession = {
    getStatus,
    getDefaultStatus: jest.fn(),
    logout,
    establishSession: jest.fn(),
  } as unknown as WaivioAuthSessionService;

  const refreshConnections = jest.fn().mockResolvedValue(undefined);
  const notificationsSocket = {
    refreshConnections,
  } as unknown as NotificationsSocketService;

  const authClient = {} as unknown as WaivioAuthClientService;
  const hasSession = {} as unknown as HasSessionService;
  const localKeys = {} as unknown as LocalKeysService;
  const signerResolver = {
    resolve: jest.fn(),
  } as unknown as WalletSignerResolverService;

  let service: WaivioAuthOrchestratorService;

  beforeEach(() => {
    jest.clearAllMocks();
    pending.setWaivioAuth('req-bob', {
      status: 'pending',
      account: 'bob',
      provider: 'keychain',
      expiresAt: Date.now() + 60_000,
    });
    getStatus.mockImplementation((account: string) => {
      if (account === 'alice') {
        return { active: true, account: 'alice', provider: 'keychain' as const };
      }
      return { active: false };
    });

    service = new WaivioAuthOrchestratorService(
      config as never,
      pending,
      authClient,
      waivioSession,
      hasSession,
      localKeys,
      signerResolver,
      notificationsSocket,
    );
  });

  it('does not report active for a pending request when another account is authenticated', () => {
    const status = service.authStatus('req-bob');
    expect(status).toEqual({
      status: 'pending',
      account: 'bob',
      provider: 'keychain',
      expiresAt: expect.any(Number),
    });
  });

  it('reports active only for the account tied to the request', () => {
    pending.updateWaivioAuth('req-bob', {
      status: 'active',
      account: 'bob',
      provider: 'keychain',
      expiresAt: Date.now() + 60_000,
    });
    getStatus.mockImplementation((account: string) => {
      if (account === 'bob') {
        return { active: true, account: 'bob', provider: 'keychain' as const };
      }
      if (account === 'alice') {
        return { active: true, account: 'alice', provider: 'keychain' as const };
      }
      return { active: false };
    });

    expect(service.authStatus('req-bob')).toEqual({
      status: 'active',
      account: 'bob',
      provider: 'keychain',
    });
  });

  it('logout without account uses defaultAccount, not first persisted session', async () => {
    await service.authLogout();

    expect(logout).toHaveBeenCalledWith('alice');
    expect(refreshConnections).toHaveBeenCalledTimes(1);
  });

  it('logout with account only clears that account', async () => {
    await service.authLogout('bob');

    expect(logout).toHaveBeenCalledWith('bob');
    expect(refreshConnections).toHaveBeenCalledTimes(1);
  });
});
