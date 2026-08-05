import { resolveHasSignWaitKind } from './has-sign-wait-events';

describe('resolveHasSignWaitKind', () => {
  it('returns vote for vote operations', () => {
    expect(
      resolveHasSignWaitKind([
        {
          type: 'vote',
          voter: 'alice',
          author: 'bob',
          permlink: 'post',
          weight: 10000,
        },
      ]),
    ).toBe('vote');
  });

  it('returns comment for comment operations', () => {
    expect(
      resolveHasSignWaitKind([
        {
          type: 'comment',
          parent_author: 'bob',
          parent_permlink: 'post',
          author: 'alice',
          permlink: 'reply',
          title: '',
          body: 'hi',
          json_metadata: '{}',
        },
      ]),
    ).toBe('comment');
  });

  it('returns transaction for custom_json operations', () => {
    expect(
      resolveHasSignWaitKind([
        {
          type: 'custom_json',
          required_auths: ['alice'],
          required_posting_auths: [],
          id: 'ssc-mainnet-hive',
          json: '{}',
        },
      ]),
    ).toBe('transaction');
  });

  it('returns generic for mixed operations', () => {
    expect(
      resolveHasSignWaitKind([
        {
          type: 'vote',
          voter: 'alice',
          author: 'bob',
          permlink: 'post',
          weight: 10000,
        },
        {
          type: 'comment',
          parent_author: 'bob',
          parent_permlink: 'post',
          author: 'alice',
          permlink: 'reply',
          title: '',
          body: 'hi',
          json_metadata: '{}',
        },
      ]),
    ).toBe('generic');
  });
});
