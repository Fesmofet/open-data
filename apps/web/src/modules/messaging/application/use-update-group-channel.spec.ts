/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';

import { useUpdateGroupChannel } from './use-update-group-channel';

const mockBroadcast = jest.fn();
const mockAwaitTrx = jest.fn();
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
  },
}));

jest.mock(
  '@/shared/infrastructure/query/revalidate-after-broadcast.server',
  () => ({
    revalidateMessagingAfterBroadcast: (...args: unknown[]) => mockRevalidate(...args),
  }),
);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock('@opden-data-layer/hive-broadcast', () => ({
  buildOslChannelUpdateOp: jest.fn(({ payload }) => ({
    id: 'osl-testnet',
    json: JSON.stringify({ events: [{ action: 'channel_update', payload }] }),
    required_posting_auths: ['alice'],
  })),
}));

describe('useUpdateGroupChannel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBroadcast.mockResolvedValue({ transactionId: 'tx-1' });
    mockAwaitTrx.mockResolvedValue(undefined);
    mockRevalidate.mockResolvedValue(undefined);
  });

  it('broadcasts channel_update and revalidates', async () => {
    const onUpdated = jest.fn();
    const { result } = renderHook(() =>
      useUpdateGroupChannel({
        viewerUsername: 'alice',
        revalidateAccountName: 'alice',
        onUpdated,
      }),
    );

    let ok = false;
    await act(async () => {
      ok = await result.current.updateGroupChannel({
        channelId: 'grp-1',
        title: 'Renamed',
        imageCid: 'QmTest',
      });
    });

    expect(ok).toBe(true);
    expect(mockBroadcast).toHaveBeenCalled();
    expect(mockRevalidate).toHaveBeenCalledWith('alice', 'grp-1');
    expect(onUpdated).toHaveBeenCalledWith({
      channelId: 'grp-1',
      title: 'Renamed',
      imageCid: 'QmTest',
    });
  });
});
