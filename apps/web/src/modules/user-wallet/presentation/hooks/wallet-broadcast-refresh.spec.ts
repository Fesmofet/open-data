/**
 * @jest-environment jsdom
 */
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { ENGINE_WALLET_SETTLEMENT_REFRESH_MS } from '@/modules/user-wallet/constants/wallet-broadcast';

import { refreshWalletAfterBroadcast } from './wallet-broadcast-refresh';

const mockRefreshAfterBroadcast = jest.fn();
const mockRevalidateUserWalletAfterBroadcast = jest.fn();

jest.mock('@/shared/infrastructure/query/refresh-after-broadcast', () => ({
  refreshAfterBroadcast: (...args: unknown[]) => mockRefreshAfterBroadcast(...args),
}));

jest.mock('@/shared/infrastructure/query/revalidate-after-broadcast.server', () => ({
  revalidateUserWalletAfterBroadcast: (...args: unknown[]) =>
    mockRevalidateUserWalletAfterBroadcast(...args),
}));

describe('refreshWalletAfterBroadcast', () => {
  const router = { refresh: jest.fn() } as unknown as AppRouterInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockRefreshAfterBroadcast.mockResolvedValue(undefined);
    mockRevalidateUserWalletAfterBroadcast.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('revalidates all wallet tags and bumps epoch', async () => {
    const bumpWalletEpoch = jest.fn();

    await refreshWalletAfterBroadcast(router, 'alice', { bumpWalletEpoch });

    expect(bumpWalletEpoch).toHaveBeenCalled();
    expect(mockRefreshAfterBroadcast).toHaveBeenCalledWith(
      router,
      expect.any(Function),
    );
    const revalidateFn = mockRefreshAfterBroadcast.mock.calls[0]?.[1] as () => Promise<void>;
    await revalidateFn();
    expect(mockRevalidateUserWalletAfterBroadcast).toHaveBeenCalledWith('alice');
  });

  it('schedules deferred router refresh for engine settlement', async () => {
    await refreshWalletAfterBroadcast(router, 'alice', {
      scheduleEngineSettlementRefresh: true,
    });

    expect(router.refresh).not.toHaveBeenCalled();

    jest.advanceTimersByTime(ENGINE_WALLET_SETTLEMENT_REFRESH_MS);

    expect(router.refresh).toHaveBeenCalledTimes(1);
  });
});
