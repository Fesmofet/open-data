/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';

import { HIVESIGNER_REDIRECT_INITIATED } from '@/modules/auth/infrastructure/signers/hivesigner-signer';

import { useEngineTokenBroadcast } from './use-engine-token-broadcast';

const mockBroadcast = jest.fn();
const mockRefresh = jest.fn();
const mockRevalidate = jest.fn();
const mockAwaitTrx = jest.fn();

jest.mock('@/modules/auth', () => ({
  getWalletFacade: () => ({
    broadcast: mockBroadcast,
  }),
}));

jest.mock('@/modules/notifications', () => ({
  awaitTrxConfirmation: (...args: unknown[]) => mockAwaitTrx(...args),
}));

jest.mock('@/shared/infrastructure/query/refresh-after-broadcast', () => ({
  refreshAfterBroadcast: async (...args: unknown[]) => {
    const fn = args[1] as (() => Promise<void>) | undefined;
    if (fn) {
      await fn();
    }
    return mockRefresh(...args);
  },
}));

jest.mock(
  '@/shared/infrastructure/query/revalidate-after-broadcast.server',
  () => ({
    revalidateUserWaivWalletAfterBroadcast: (...args: unknown[]) =>
      mockRevalidate(...args),
  }),
);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

describe('useEngineTokenBroadcast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBroadcast.mockResolvedValue({ transactionId: 'tx-1' });
    mockAwaitTrx.mockResolvedValue(undefined);
    mockRefresh.mockResolvedValue(undefined);
    mockRevalidate.mockResolvedValue(undefined);
  });

  it('does not set error when HiveSigner redirect is initiated', async () => {
    mockBroadcast.mockRejectedValue(new Error(HIVESIGNER_REDIRECT_INITIATED));
    const { result } = renderHook(() => useEngineTokenBroadcast('alice'));

    let ok = false;
    await act(async () => {
      ok = await result.current.broadcast('transfer', {
        symbol: 'WAIV',
        quantity: '1',
        to: 'bob',
      });
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('maps broadcast failures to error codes', async () => {
    mockBroadcast.mockRejectedValue(new Error('Not logged in'));
    const { result } = renderHook(() => useEngineTokenBroadcast('alice'));

    await act(async () => {
      await result.current.broadcast('stake', { symbol: 'WAIV', quantity: '1' });
    });

    expect(result.current.error).toBe('not_logged_in');
  });

  it('refreshes wallet after successful broadcast', async () => {
    const { result } = renderHook(() => useEngineTokenBroadcast('alice'));

    let ok = false;
    await act(async () => {
      ok = await result.current.broadcast('stake', { symbol: 'WAIV', quantity: '1' });
    });

    expect(ok).toBe(true);
    expect(mockAwaitTrx).toHaveBeenCalledWith('tx-1');
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockRevalidate).toHaveBeenCalledWith('alice');
  });
});
