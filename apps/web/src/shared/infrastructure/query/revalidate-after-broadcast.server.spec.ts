jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  updateTag: jest.fn(),
}));

import { updateTag } from 'next/cache';

import { queryApiCacheTags } from './query-api-cache-tags';
import { revalidateObjectAfterBroadcast } from './revalidate-after-broadcast.server';

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
