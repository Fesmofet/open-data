import { buildSocialMessage } from './social';

const baseEnvelope = {
  occurredAt: '2026-01-01T00:00:00.000Z',
  blockNum: 1,
  trxId: 'trx',
  objectId: null,
  actor: 'alice',
};

describe('buildSocialMessage', () => {
  it('maps my_comment to parentAuthor param', () => {
    const msg = buildSocialMessage({
      ...baseEnvelope,
      type: 'my_comment',
      payload: {
        author: 'alice',
        permlink: 'c1',
        parentAuthor: 'bob',
      },
    });
    expect(msg?.key).toBe('my_comment_notify');
    expect(msg?.params).toEqual({ parentAuthor: 'bob' });
  });

  it('maps my_post to post param from title', () => {
    const msg = buildSocialMessage({
      ...baseEnvelope,
      type: 'my_post',
      payload: {
        author: 'alice',
        permlink: 'p1',
        title: 'Hello',
      },
    });
    expect(msg?.key).toBe('my_post_notify');
    expect(msg?.params).toEqual({ post: 'Hello' });
  });

  it('maps my_post post param from permlink when title missing', () => {
    const msg = buildSocialMessage({
      ...baseEnvelope,
      type: 'my_post',
      payload: {
        author: 'alice',
        permlink: 'p1',
        title: 'p1',
      },
    });
    expect(msg?.params).toEqual({ post: 'p1' });
  });

  it('maps my_vote to post param', () => {
    const msg = buildSocialMessage({
      ...baseEnvelope,
      type: 'my_vote',
      payload: {
        voter: 'alice',
        author: 'bob',
        permlink: 'p1',
        title: 'Post title',
      },
    });
    expect(msg?.key).toBe('my_like_notify');
    expect(msg?.params).toEqual({ post: 'Post title' });
  });

  it('uses post reply template when isReplyToComment is false', () => {
    const msg = buildSocialMessage({
      ...baseEnvelope,
      type: 'reply',
      payload: {
        author: 'alice',
        permlink: 'c1',
        parentAuthor: 'bob',
        parentPermlink: 'p1',
        isRootPost: false,
        isReplyToComment: false,
      },
    });
    expect(msg?.key).toBe('notification_reply_username_post');
  });

  it('uses comment reply template when isReplyToComment is true', () => {
    const msg = buildSocialMessage({
      ...baseEnvelope,
      type: 'reply',
      payload: {
        author: 'alice',
        permlink: 'c2',
        parentAuthor: 'bob',
        parentPermlink: 'c1',
        isRootPost: false,
        isReplyToComment: true,
      },
    });
    expect(msg?.key).toBe('notification_reply_username_comment');
  });

  it('defaults reply to post template when isReplyToComment is absent', () => {
    const msg = buildSocialMessage({
      ...baseEnvelope,
      type: 'reply',
      payload: {
        author: 'alice',
        permlink: 'c1',
        parentAuthor: 'bob',
        parentPermlink: 'p1',
        isRootPost: false,
      },
    });
    expect(msg?.key).toBe('notification_reply_username_post');
  });
});
