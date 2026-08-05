/** @jest-environment jsdom */

import {
  clearHasAuthSession,
  getHasAuthSession,
  saveHasAuthSession,
  toHasWrapperAuth,
} from './has-auth-session.storage';

describe('has-auth-session.storage', () => {
  beforeEach(() => {
    clearHasAuthSession();
  });

  it('maps session to legacy HAS auth object including hasSessionToken', () => {
    const session = {
      username: 'alice',
      key: 'auth-key-uuid',
      expire: Date.now() + 60_000,
      hasSessionToken: 'has-session-token',
    };
    expect(toHasWrapperAuth(session)).toEqual({
      username: 'alice',
      key: 'auth-key-uuid',
      expire: session.expire,
      token: 'has-session-token',
    });
  });

  it('migrates legacy token field on read', () => {
    localStorage.setItem(
      'odl_hiveauth_session',
      JSON.stringify({
        username: 'bob',
        key: 'key-1',
        expire: Date.now() + 60_000,
        token: 'legacy-token',
      }),
    );
    const session = getHasAuthSession();
    expect(session?.hasSessionToken).toBe('legacy-token');
  });

  it('persists hasSessionToken when saved and read back', () => {
    saveHasAuthSession({
      username: 'bob',
      key: 'key-1',
      expire: Date.now() + 60_000,
      hasSessionToken: 'tok-abc',
      host: 'wss://hive-auth.arcange.eu',
    });
    const session = getHasAuthSession();
    expect(session?.hasSessionToken).toBe('tok-abc');
  });

  it('auto-clears expired session on read', () => {
    saveHasAuthSession({
      username: 'alice',
      key: 'key-1',
      expire: Date.now() - 60_000,
    });
    expect(getHasAuthSession()).toBeNull();
    expect(localStorage.getItem('odl_hiveauth_session')).toBeNull();
  });
});
