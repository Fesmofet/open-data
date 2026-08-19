import {
  buildGroupChannelCreatePayload,
  buildMessageCreatePayload,
  buildObjectChannelCreatePayload,
  buildOptimisticGroupChannelListItem,
  filterChannelsBySearch,
  filterChannelsByUnread,
  generateGroupChannelId,
  mergeChannelListItems,
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
