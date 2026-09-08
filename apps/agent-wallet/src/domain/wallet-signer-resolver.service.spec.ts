import { WalletSignerResolverService } from './wallet-signer-resolver.service';
import type { HasSessionService } from './has-session.service';
import type { LocalKeysService } from './local-keys.service';

describe('WalletSignerResolverService', () => {
  const localKeys = {
    hasAccount: jest.fn(),
    listAccounts: jest.fn().mockReturnValue(['alice']),
  } as unknown as LocalKeysService;

  const hasSession = {
    getSessionInfo: jest.fn(),
  } as unknown as HasSessionService;

  let signingMode: 'has' | 'local' = 'has';

  const config = {
    get: jest.fn((key: string) => {
      if (key === 'signingMode') {
        return signingMode;
      }
      if (key === 'defaultAccount') {
        return 'alice';
      }
      return undefined;
    }),
  };

  let service: WalletSignerResolverService;

  beforeEach(() => {
    jest.clearAllMocks();
    signingMode = 'has';
    localKeys.hasAccount = jest.fn((account: string) => account === 'alice');
    localKeys.listAccounts = jest.fn().mockReturnValue(['alice']);
    hasSession.getSessionInfo = jest.fn().mockReturnValue({ account: 'bob', expiresAt: Date.now() + 60_000 });
    service = new WalletSignerResolverService(config as never, localKeys, hasSession);
  });

  it('resolves explicit registry account to local even when HAS session is different', () => {
    expect(service.resolve('alice')).toEqual({ mode: 'local', account: 'alice' });
  });

  it('resolves explicit HAS session account to has', () => {
    expect(service.resolve('bob')).toEqual({ mode: 'has', account: 'bob' });
  });

  it('rejects unknown explicit account', () => {
    expect(() => service.resolve('carol')).toThrow(/carol/);
    expect(() => service.resolve('carol')).toThrow(/alice/);
  });

  it('prefers HAS session when signingMode is has and account omitted', () => {
    expect(service.resolve()).toEqual({ mode: 'has', account: 'bob' });
  });

  it('prefers registry default when signingMode is has and HAS session absent', () => {
    hasSession.getSessionInfo = jest.fn().mockReturnValue(null);
    expect(service.resolve()).toEqual({ mode: 'local', account: 'alice' });
  });

  it('prefers registry default when signingMode is local', () => {
    signingMode = 'local';
    expect(service.resolve()).toEqual({ mode: 'local', account: 'alice' });
  });

  it('throws when no signer is configured', () => {
    hasSession.getSessionInfo = jest.fn().mockReturnValue(null);
    localKeys.hasAccount = jest.fn().mockReturnValue(false);
    localKeys.listAccounts = jest.fn().mockReturnValue([]);
    config.get = jest.fn((key: string) => {
      if (key === 'signingMode') {
        return signingMode;
      }
      if (key === 'defaultAccount') {
        return undefined;
      }
      return undefined;
    });
    service = new WalletSignerResolverService(config as never, localKeys, hasSession);
    expect(() => service.resolve()).toThrow(/No configured signing account/);
  });

  it('normalizes explicit account before lookup', () => {
    expect(service.resolve('@Alice')).toEqual({ mode: 'local', account: 'alice' });
  });
});
