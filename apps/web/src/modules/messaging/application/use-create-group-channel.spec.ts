/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';

import { useCreateGroupChannel } from './use-create-group-channel';

const mockBroadcast = jest.fn();
const mockAwaitTrx = jest.fn();
const mockRefresh = jest.fn();

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
    revalidateMessagingAfterBroadcast: jest.fn().mockResolvedValue(undefined),
  }),
);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock('../domain/messaging.helpers', () => ({
  generateGroupChannelId: () => 'grp-test-id',
  buildGroupChannelCreatePayload: jest.fn(({ channelId, members, title }) => ({
    kind: 'group',
    channel_id: channelId,
    members,
    ...(title ? { title } : {}),
  })),
}));

describe('useCreateGroupChannel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBroadcast.mockResolvedValue({ transactionId: 'tx-1' });
    mockAwaitTrx.mockResolvedValue(undefined);
    mockRefresh.mockResolvedValue(undefined);
  });

  it('broadcasts channel_create with OSL custom json id', async () => {
    const { result } = renderHook(() =>
      useCreateGroupChannel({ viewerUsername: 'alice', revalidateAccountName: 'alice' }),
    );

    let channelId: string | null = null;
    await act(async () => {
      channelId = await result.current.createGroupChannel({
        members: ['bob', 'carol'],
        title: 'Team',
      });
    });

    expect(channelId).toBe('grp-test-id');
    expect(mockBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        operations: [
          expect.objectContaining({
            id: 'osl-testnet',
          }),
        ],
      }),
    );
  });

  it('returns null when broadcast fails', async () => {
    mockBroadcast.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() =>
      useCreateGroupChannel({ viewerUsername: 'alice' }),
    );

    let channelId: string | null = 'pending';
    await act(async () => {
      channelId = await result.current.createGroupChannel({ members: ['bob', 'carol'] });
    });

    expect(channelId).toBeNull();
  });
});
