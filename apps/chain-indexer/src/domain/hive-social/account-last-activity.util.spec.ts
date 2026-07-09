import {
  accountNameFromHiveOperation,
  collectActiveAccountNamesFromBlock,
} from './account-last-activity.util';

describe('account-last-activity.util', () => {
  it('maps vote to voter', () => {
    expect(
      accountNameFromHiveOperation('vote', { voter: 'alice', author: 'bob' }),
    ).toBe('alice');
  });

  it('maps custom_json to required_auths', () => {
    expect(
      accountNameFromHiveOperation('custom_json', {
        required_auths: ['alice'],
        required_posting_auths: ['bob'],
      }),
    ).toBe('alice');
  });

  it('maps custom_json to required_posting_auths when auths empty', () => {
    expect(
      accountNameFromHiveOperation('custom_json', {
        required_auths: [],
        required_posting_auths: ['bob'],
      }),
    ).toBe('bob');
  });

  it('collects unique names from block transactions', () => {
    const names = collectActiveAccountNamesFromBlock([
      {
        operations: [
          ['vote', { voter: 'alice' }],
          ['comment', { author: 'bob' }],
          ['vote', { voter: 'alice' }],
        ],
      },
      {
        operations: [['transfer', { from: 'carol', to: 'dave' }]],
      },
    ]);
    expect(names.sort()).toEqual(['alice', 'bob', 'carol']);
  });
});
