/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';

import { HIVESIGNER_REDIRECT_INITIATED } from '@/modules/auth/infrastructure/signers/hivesigner-signer';
import { ENGINE_WALLET_SETTLEMENT_REFRESH_MS } from '@/modules/user-wallet/constants/wallet-broadcast';

import { useEngineTokenBroadcast } from './use-engine-token-broadcast';

const mockBroadcast = jest.fn();
const mockRefreshAfterBroadcast = jest.fn();
const mockRefreshWalletAfterBroadcast = jest.fn();
const mockAwaitTrx = jest.fn();
const mockBumpWalletEpoch = jest.fn();
const mockRouterRefresh = jest.fn();

jest.mock('@/modules/auth', () => ({
  getWalletFacade: () => ({
    broadcast: mockBroadcast,
  }),
  hydrateWalletProviderFromStorage: jest.fn(),
}));

jest.mock('@/modules/notifications', () => ({
  awaitTrxConfirmation: (...args: unknown[]) => mockAwaitTrx(...args),
}));

jest.mock('./wallet-broadcast-refresh', () => ({
  refreshWalletAfterBroadcast: (...args: unknown[]) =>
    mockRefreshWalletAfterBroadcast(...args),
}));

jest.mock('@/shared/infrastructure/query/refresh-after-broadcast', () => ({
  refreshAfterBroadcast: (...args: unknown[]) => mockRefreshAfterBroadcast(...args),
}));

jest.mock('../components/wallet/wallet-balances-context', () => ({
  useWalletBalances: () => ({
    bumpWalletEpoch: mockBumpWalletEpoch,
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}));

describe('useEngineTokenBroadcast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockBroadcast.mockResolvedValue({ transactionId: 'tx-1' });
    mockAwaitTrx.mockResolvedValue(undefined);
    mockRefreshWalletAfterBroadcast.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('refreshes wallet after successful broadcast with engine settlement refresh', async () => {
    const { result } = renderHook(() => useEngineTokenBroadcast('alice'));

    let ok = false;
    await act(async () => {
      ok = await result.current.broadcast('stake', { symbol: 'WAIV', quantity: '1' });
    });

    expect(ok).toBe(true);
    expect(mockAwaitTrx).toHaveBeenCalledWith('tx-1');
    expect(mockRefreshWalletAfterBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({ refresh: mockRouterRefresh }),
      'alice',
      {
        bumpWalletEpoch: mockBumpWalletEpoch,
        scheduleEngineSettlementRefresh: true,
      },
    );
  });

  it('schedules deferred router refresh via refreshWalletAfterBroadcast helper', async () => {
    mockRefreshWalletAfterBroadcast.mockImplementation(
      async (router, account, options) => {
        options?.bumpWalletEpoch?.();
        if (options?.scheduleEngineSettlementRefresh) {
          window.setTimeout(() => router.refresh(), ENGINE_WALLET_SETTLEMENT_REFRESH_MS);
        }
      },
    );

    const { result } = renderHook(() => useEngineTokenBroadcast('alice'));

    await act(async () => {
      await result.current.broadcast('stake', { symbol: 'WAIV', quantity: '1' });
    });

    expect(mockBumpWalletEpoch).toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(ENGINE_WALLET_SETTLEMENT_REFRESH_MS);
    });

    expect(mockRouterRefresh).toHaveBeenCalled();
  });
});
