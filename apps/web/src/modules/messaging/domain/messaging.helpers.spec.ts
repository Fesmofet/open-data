import {
  buildGroupChannelCreatePayload,
  buildChannelLeavePayload,
  buildChannelMemberAddPayload,
  buildChannelUpdatePayload,
  canSelectMoreGroupMembers,
  buildMessageCreatePayload,
  buildObjectChannelCreatePayload,
  buildOptimisticGroupChannelListItem,
  filterChannelsBySearch,
  filterChannelsByUnread,
  generateGroupChannelId,
  mergeChannelListItems,
  remainingGroupMemberSlots,
  resolveChannelImageUrl,
} from './messaging.helpers';

describe('filterChannelsByUnread', () => {
  const channels = [
    { channel_id: 'a', unread_count: 3 },
    { channel_id: 'b', unread_count: 0 },
    { channel_id: 'c', unread_count: 1 },
  ];

  it('returns only channels with positive unread_count', () => {
    expect(filterChannelsByUnread(channels)).toEqual([
      { channel_id: 'a', unread_count: 3 },
      { channel_id: 'c', unread_count: 1 },
    ]);
  });
});

describe('filterChannelsBySearch', () => {
  const channels = [
    { display_title: 'WAIVIO Community', list_title: 'WAIVIO Community' },
    { display_title: 'alice', list_title: 'alice & bob' },
  ];

  it('filters channels by display or list title', () => {
    expect(filterChannelsBySearch(channels, 'waivio')).toEqual([
      { display_title: 'WAIVIO Community', list_title: 'WAIVIO Community' },
    ]);
  });
});

describe('buildMessageCreatePayload', () => {
  it('uses channel_id for existing channel', () => {
    expect(
      buildMessageCreatePayload({ channelId: 'dm-abc123', body: 'hello' }),
    ).toEqual({ channel_id: 'dm-abc123', body: 'hello' });
  });

  it('uses peer for new DM bootstrap', () => {
    expect(buildMessageCreatePayload({ peer: 'bob', body: 'hi' })).toEqual({
      peer: 'bob',
      body: 'hi',
    });
  });
});

describe('generateGroupChannelId', () => {
  it('matches grp- prefix and stays within max length', () => {
    const id = generateGroupChannelId();
    expect(id.startsWith('grp-')).toBe(true);
    expect(id.length).toBeLessThanOrEqual(256);
  });
});

describe('buildGroupChannelCreatePayload', () => {
  it('builds valid group envelope body', () => {
    expect(
      buildGroupChannelCreatePayload({
        channelId: 'grp-1',
        members: ['bob', 'carol'],
        title: 'Team',
        viewerUsername: 'alice',
      }),
    ).toEqual({
      kind: 'group',
      channel_id: 'grp-1',
      title: 'Team',
      members: ['bob', 'carol'],
    });
  });

  it('omits title when empty', () => {
    expect(
      buildGroupChannelCreatePayload({
        channelId: 'grp-1',
        members: ['bob'],
        title: '',
      }),
    ).toEqual({
      kind: 'group',
      channel_id: 'grp-1',
      members: ['bob'],
    });
  });

  it('excludes viewer if accidentally in selection', () => {
    expect(
      buildGroupChannelCreatePayload({
        channelId: 'grp-1',
        members: ['alice', 'bob'],
        viewerUsername: 'alice',
      }),
    ).toEqual({
      kind: 'group',
      channel_id: 'grp-1',
      members: ['bob'],
    });
  });
});

describe('buildOptimisticGroupChannelListItem', () => {
  it('uses provided title for left rail label', () => {
    expect(
      buildOptimisticGroupChannelListItem({
        channelId: 'grp-1',
        members: ['bob'],
        viewerUsername: 'alice',
        title: 'Team lunch',
      }),
    ).toMatchObject({
      channel_id: 'grp-1',
      kind: 'group',
      display_title: 'Team lunch',
      list_title: 'Team lunch',
    });
  });

  it('falls back to member names when title omitted', () => {
    expect(
      buildOptimisticGroupChannelListItem({
        channelId: 'grp-1',
        members: ['carol', 'bob'],
        viewerUsername: 'alice',
      }).display_title,
    ).toBe('bob & carol');
  });
});

describe('mergeChannelListItems', () => {
  it('prefers server item over optimistic duplicate id', () => {
    const optimistic = buildOptimisticGroupChannelListItem({
      channelId: 'grp-1',
      members: ['bob'],
      viewerUsername: 'alice',
      title: 'Draft',
    });
    const server = { ...optimistic, display_title: 'Final', list_title: 'Final' };
    expect(mergeChannelListItems([server], [optimistic])).toEqual([server]);
  });
});

describe('buildObjectChannelCreatePayload', () => {
  it('builds object channel create payload', () => {
    expect(
      buildObjectChannelCreatePayload({
        objectId: 'obj-1',
        objectName: 'My Shop',
      }),
    ).toEqual({
      kind: 'object',
      channel_id: 'obj-ch-obj-1',
      object_id: 'obj-1',
      title: 'My Shop',
    });
  });
});

describe('buildChannelLeavePayload', () => {
  it('includes optional successor and delete flag', () => {
    expect(
      buildChannelLeavePayload({
        channelId: 'grp-1',
        successorAdmin: 'bob',
        deleteMyMessages: true,
      }),
    ).toEqual({
      channel_id: 'grp-1',
      successor_admin: 'bob',
      delete_my_messages: true,
    });
  });

  it('omits optional fields when not set', () => {
    expect(buildChannelLeavePayload({ channelId: 'grp-1' })).toEqual({
      channel_id: 'grp-1',
    });
  });
});

describe('buildChannelUpdatePayload', () => {
  it('builds title and image update payload', () => {
    expect(
      buildChannelUpdatePayload({
        channelId: 'grp-1',
        title: 'Team',
        imageCid: 'QmTest',
      }),
    ).toEqual({
      channel_id: 'grp-1',
      title: 'Team',
      image: { cid: 'QmTest' },
    });
  });

  it('throws when no fields provided', () => {
    expect(() => buildChannelUpdatePayload({ channelId: 'grp-1' })).toThrow(
      'title or imageCid is required',
    );
  });
});

describe('remainingGroupMemberSlots', () => {
  it('returns remaining slots until cap', () => {
    expect(remainingGroupMemberSlots(98)).toBe(2);
    expect(remainingGroupMemberSlots(100)).toBe(0);
  });
});

describe('canSelectMoreGroupMembers', () => {
  it('allows selection within cap', () => {
    expect(canSelectMoreGroupMembers(98, 2)).toBe(true);
    expect(canSelectMoreGroupMembers(98, 3)).toBe(false);
  });
});

describe('buildChannelMemberAddPayload', () => {
  it('builds member add payload', () => {
    expect(
      buildChannelMemberAddPayload({ channelId: 'grp-1', account: 'bob' }),
    ).toEqual({ channel_id: 'grp-1', account: 'bob' });
  });
});

describe('resolveChannelImageUrl', () => {
  it('returns direct url when present', () => {
    expect(resolveChannelImageUrl({ url: 'https://img.test/a.png' })).toBe(
      'https://img.test/a.png',
    );
  });

  it('resolves cid via content base', () => {
    expect(
      resolveChannelImageUrl({ cid: 'QmTest' }, 'https://cdn.example.com'),
    ).toBe('https://cdn.example.com/ipfs-gateway/content/image/QmTest');
  });

  it('returns null for cid without content base', () => {
    expect(resolveChannelImageUrl({ cid: 'QmTest' })).toBeNull();
  });
});
