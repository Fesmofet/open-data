/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';

import { useAddGroupMembers } from './use-add-group-members';

const mockBroadcast = jest.fn();
const mockValidate = jest.fn();

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
  awaitTrxConfirmation: jest.fn().mockResolvedValue(undefined),
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
    revalidateMessagingAfterBroadcast: jest.fn().mockResolvedValue(undefined),
  }),
);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock('../infrastructure/messaging-validate.client', () => ({
  validateChannelMembers: (...args: unknown[]) => mockValidate(...args),
}));

jest.mock('@opden-data-layer/hive-broadcast', () => ({
  buildOslChannelMemberAddOp: jest.fn(({ payload }) => ({
    id: 'osl-testnet',
    json: JSON.stringify({ events: [{ action: 'channel_member_add', payload }] }),
    required_posting_auths: ['alice'],
  })),
}));

describe('useAddGroupMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBroadcast.mockResolvedValue({ transactionId: 'tx-1' });
    mockValidate.mockResolvedValue({
      results: [
        { account: 'bob', addable: true },
        { account: 'carol', addable: true },
      ],
    });
  });

  it('broadcasts multiple channel_member_add ops in one trx', async () => {
    const onAdded = jest.fn();
    const { result } = renderHook(() =>
      useAddGroupMembers({
        viewerUsername: 'alice',
        revalidateAccountName: 'alice',
        onAdded,
      }),
    );

    let ok = false;
    await act(async () => {
      ok = await result.current.addGroupMembers({
        channelId: 'grp-1',
        accounts: ['bob', 'carol'],
      });
    });

    expect(ok).toBe(true);
    expect(mockValidate).toHaveBeenCalledWith('grp-1', 'alice', ['bob', 'carol']);
    expect(mockBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({ operations: expect.any(Array) }),
    );
    expect(mockBroadcast.mock.calls[0]?.[0].operations).toHaveLength(2);
    expect(onAdded).toHaveBeenCalledWith({
      channelId: 'grp-1',
      accounts: ['bob', 'carol'],
    });
  });

  it('returns false when no accounts are addable', async () => {
    mockValidate.mockResolvedValue({
      results: [{ account: 'bob', addable: false, reason: 'muted_by_viewer' }],
    });
    const { result } = renderHook(() =>
      useAddGroupMembers({ viewerUsername: 'alice' }),
    );

    let ok = true;
    await act(async () => {
      ok = await result.current.addGroupMembers({
        channelId: 'grp-1',
        accounts: ['bob'],
      });
    });

    expect(ok).toBe(false);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });
});
