import { buildExcludedPostKeysFromRemoveUpdates } from './remove-post-keys';

describe('buildExcludedPostKeysFromRemoveUpdates', () => {
  it('parses author/permlink into author_permlink keys', () => {
    expect(
      buildExcludedPostKeysFromRemoveUpdates([
        'alice/my-post',
        'bob/other_permlink_here',
        'invalid',
        '',
      ]),
    ).toEqual(['alice_my-post', 'bob_other_permlink_here']);
  });
});
