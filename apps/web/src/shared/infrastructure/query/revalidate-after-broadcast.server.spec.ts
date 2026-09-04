jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  updateTag: jest.fn(),
}));

import { revalidatePath, updateTag } from 'next/cache';

import { queryApiCacheTags } from './query-api-cache-tags';
import {
  revalidateObjectAfterBroadcast,
  revalidateUserWalletAfterBroadcast,
} from './revalidate-after-broadcast.server';

describe('revalidateObjectAfterBroadcast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('invalidates objectUpdates and objectUpdate when updateId is provided', async () => {
    await revalidateObjectAfterBroadcast('obj-1', { updateId: 'upd-1' });

    expect(updateTag).toHaveBeenCalledWith(queryApiCacheTags.objectUpdates('obj-1'));
    expect(updateTag).toHaveBeenCalledWith(
      queryApiCacheTags.objectUpdate('obj-1', 'upd-1'),
    );
  });

  it('does not invalidate objectUpdate tag when updateId is omitted', async () => {
    await revalidateObjectAfterBroadcast('obj-1');

    expect(updateTag).toHaveBeenCalledWith(queryApiCacheTags.objectUpdates('obj-1'));
    expect(updateTag).not.toHaveBeenCalledWith(
      expect.stringMatching(/:updates:upd/),
    );
  });
});

describe('revalidateUserWalletAfterBroadcast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('invalidates all wallet summary and delegation tags', async () => {
    await revalidateUserWalletAfterBroadcast('Alice');

    expect(updateTag).toHaveBeenCalledWith(queryApiCacheTags.userWaivWallet('alice'));
    expect(updateTag).toHaveBeenCalledWith(queryApiCacheTags.userHiveWallet('alice'));
    expect(updateTag).toHaveBeenCalledWith(queryApiCacheTags.userEngineWallet('alice'));
    expect(updateTag).toHaveBeenCalledWith(queryApiCacheTags.userAccountSidebar('alice'));
    expect(updateTag).toHaveBeenCalledWith(
      queryApiCacheTags.userHiveHpDelegations('alice'),
    );
    expect(updateTag).toHaveBeenCalledWith(
      queryApiCacheTags.userHiveRcDelegations('alice'),
    );
    expect(updateTag).toHaveBeenCalledWith(
      queryApiCacheTags.userEngineTokenDelegations('alice', 'WAIV'),
    );
    expect(updateTag).toHaveBeenCalledWith(
      queryApiCacheTags.userActivityFeed('alice', 'wallet'),
    );
  });

  it('revalidates public and internal transfers paths', async () => {
    await revalidateUserWalletAfterBroadcast('alice');

    expect(revalidatePath).toHaveBeenCalledWith('/@alice/transfers', 'page');
    expect(revalidatePath).toHaveBeenCalledWith('/user-profile/alice/transfers', 'page');
  });

  it('no-ops for empty account name', async () => {
    await revalidateUserWalletAfterBroadcast('   ');

    expect(updateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
