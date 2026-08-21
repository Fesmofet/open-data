import { ForbiddenException } from '@nestjs/common';

import type { AccountsCurrentRepository } from '../../repositories/accounts-current.repository';
import type { ProfileFeedReadCursorRepository } from '../../repositories/profile-feed-read-cursor.repository';
import { MarkProfileFeedReadEndpoint } from './mark-profile-feed-read.endpoint';

describe('MarkProfileFeedReadEndpoint', () => {
  const accounts = { findByName: jest.fn() };
  const readCursorRepo = {
    setCursorMonotonic: jest.fn(),
    getCursors: jest.fn(),
  };

  const endpoint = new MarkProfileFeedReadEndpoint(
    accounts as unknown as AccountsCurrentRepository,
    readCursorRepo as unknown as ProfileFeedReadCursorRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forbids when viewer does not match account', async () => {
    await expect(
      endpoint.execute('alice', { tab: 'posts', read_at_unix: 100 }, 'bob'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns null when account is missing', async () => {
    accounts.findByName.mockResolvedValue(undefined);

    const result = await endpoint.execute(
      'alice',
      { tab: 'posts', read_at_unix: 100 },
      'alice',
    );

    expect(result).toBeNull();
    expect(readCursorRepo.setCursorMonotonic).not.toHaveBeenCalled();
  });

  it('no-ops messages tab without updating profile cursors', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });

    const result = await endpoint.execute(
      'alice',
      { tab: 'messages', read_at_unix: 500 },
      'alice',
    );

    expect(readCursorRepo.setCursorMonotonic).not.toHaveBeenCalled();
    expect(result).toEqual({ updated: false, read_at_unix: 500 });
  });

  it('advances posts cursor monotonically', async () => {
    accounts.findByName.mockResolvedValue({ name: 'alice' });
    readCursorRepo.setCursorMonotonic.mockResolvedValue(true);
    readCursorRepo.getCursors.mockResolvedValue({ posts: 200, threads: null });

    const result = await endpoint.execute(
      'alice',
      { tab: 'posts', read_at_unix: 200 },
      'alice',
    );

    expect(readCursorRepo.setCursorMonotonic).toHaveBeenCalledWith(
      'alice',
      'posts',
      200,
    );
    expect(result).toEqual({ updated: true, read_at_unix: 200 });
  });
});
