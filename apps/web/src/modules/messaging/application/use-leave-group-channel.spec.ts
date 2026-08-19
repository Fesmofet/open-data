/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';

import { useLeaveGroupChannel } from './use-leave-group-channel';

const mockBroadcast = jest.fn();
const mockAwaitTrx = jest.fn();
const mockRefresh = jest.fn();
const mockRevalidate = jest.fn();

jest.mock('@/config/odl-network-provider', () => ({
  useOslCustomJsonId: () => 'osl-testnet',
}));

jest.mock('@/modules/auth', () => ({
  getWalletFacade: () => ({
    broadcast: mockBroadcast,
  }),
  useHydrateWalletProvider: jest.fn(),
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
    revalidateMessagingAfterBroadcast: (...args: unknown[]) => mockRevalidate(...args),
  }),
);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

jest.mock('@opden-data-layer/hive-broadcast', () => ({
  buildOslChannelLeaveOp: jest.fn(({ payload }) => ({
    id: 'osl-testnet',
    json: JSON.stringify({ events: [{ action: 'channel_leave', payload }] }),
    required_posting_auths: ['alice'],
  })),
}));

describe('useLeaveGroupChannel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBroadcast.mockResolvedValue({ transactionId: 'tx-1' });
    mockAwaitTrx.mockResolvedValue(undefined);
    mockRevalidate.mockResolvedValue(undefined);
  });

  it('broadcasts channel_leave and revalidates messaging cache', async () => {
    const onLeft = jest.fn();
    const { result } = renderHook(() =>
      useLeaveGroupChannel({
        viewerUsername: 'alice',
        revalidateAccountName: 'alice',
        onLeft,
      }),
    );

    let ok = false;
    await act(async () => {
      ok = await result.current.leaveGroupChannel({
        channelId: 'grp-1',
        deleteMyMessages: true,
      });
    });

    expect(ok).toBe(true);
    expect(mockBroadcast).toHaveBeenCalled();
    expect(mockRevalidate).toHaveBeenCalledWith('alice', 'grp-1');
    expect(onLeft).toHaveBeenCalledWith('grp-1');
  });
});
