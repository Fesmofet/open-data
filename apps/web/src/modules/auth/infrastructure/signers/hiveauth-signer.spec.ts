/** @jest-environment jsdom */

import { setHasConfigClient } from '@/config/has-config.client';

import {
  dispatchHasSignError,
  dispatchHasSignSuccess,
  dispatchHasSignWait,
} from '../has-sign-wait-events';
import {
  clearHasAuthSession,
  HIVEAUTH_SESSION_EXPIRED_MESSAGE,
  HIVEAUTH_SESSION_MISSING_MESSAGE,
  saveHasAuthSession,
} from '../providers/has';
import { createHiveAuthSigner } from './hiveauth-signer';

const broadcastWithHas = jest.fn();

jest.mock('../has-sign-wait-events', () => {
  const actual = jest.requireActual('../has-sign-wait-events');
  return {
    ...actual,
    dispatchHasSignWait: jest.fn(actual.dispatchHasSignWait),
    dispatchHasSignSuccess: jest.fn(actual.dispatchHasSignSuccess),
    dispatchHasSignError: jest.fn(actual.dispatchHasSignError),
  };
});

jest.mock('../providers/has/has-client', () => ({
  broadcastWithHas: (...args: unknown[]) => broadcastWithHas(...args),
}));

describe('createHiveAuthSigner', () => {
  beforeEach(() => {
    clearHasAuthSession();
    setHasConfigClient({ wsUrl: 'wss://hive-auth.arcange.eu', appName: 'Waivio' });
    broadcastWithHas.mockReset();
    jest.mocked(dispatchHasSignWait).mockClear();
    jest.mocked(dispatchHasSignSuccess).mockClear();
    jest.mocked(dispatchHasSignError).mockClear();
  });

  it('throws when HAS session is missing', async () => {
    const signer = createHiveAuthSigner();
    await expect(
      signer.sign({
        operations: [
          {
            type: 'vote',
            voter: 'alice',
            author: 'bob',
            permlink: 'post',
            weight: 10000,
          },
        ],
      }),
    ).rejects.toThrow(HIVEAUTH_SESSION_MISSING_MESSAGE);
  });

  it('throws when HAS session is expired', async () => {
    saveHasAuthSession({
      username: 'alice',
      key: 'session-key',
      expire: Date.now() - 60_000,
    });
    const signer = createHiveAuthSigner();
    await expect(
      signer.sign({
        operations: [
          {
            type: 'vote',
            voter: 'alice',
            author: 'bob',
            permlink: 'post',
            weight: 10000,
          },
        ],
      }),
    ).rejects.toThrow(HIVEAUTH_SESSION_EXPIRED_MESSAGE);
  });

  it('broadcasts via HAS and returns transaction id', async () => {
    saveHasAuthSession({
      username: 'alice',
      key: 'session-key',
      expire: Date.now() + 60_000,
      hasSessionToken: 'has-token-xyz',
    });
    broadcastWithHas.mockImplementation(async (input) => {
      input.onSignWait?.({ uuid: 'u1', expire: Date.now() + 60_000 });
      return { data: 'abc123tx' };
    });

    const signer = createHiveAuthSigner();
    const result = await signer.sign({
      operations: [
        {
          type: 'vote',
          voter: 'alice',
          author: 'bob',
          permlink: 'post',
          weight: 10000,
        },
      ],
    });

    expect(result).toEqual({ transactionId: 'abc123tx' });
    expect(dispatchHasSignWait).toHaveBeenCalledWith('vote');
    expect(dispatchHasSignSuccess).toHaveBeenCalled();
    expect(dispatchHasSignError).not.toHaveBeenCalled();
    expect(broadcastWithHas).toHaveBeenCalledWith(
      expect.objectContaining({
        keyType: 'posting',
        session: expect.objectContaining({
          username: 'alice',
          hasSessionToken: 'has-token-xyz',
        }),
      }),
    );
  });

  it('dispatches error event when broadcast fails', async () => {
    saveHasAuthSession({
      username: 'alice',
      key: 'session-key',
      expire: Date.now() + 60_000,
    });
    broadcastWithHas.mockRejectedValue(new Error('User rejected'));

    const signer = createHiveAuthSigner();
    await expect(
      signer.sign({
        operations: [
          {
            type: 'vote',
            voter: 'alice',
            author: 'bob',
            permlink: 'post',
            weight: 10000,
          },
        ],
      }),
    ).rejects.toThrow('User rejected');

    expect(dispatchHasSignError).toHaveBeenCalledWith('User rejected');
    expect(dispatchHasSignSuccess).not.toHaveBeenCalled();
  });
});
