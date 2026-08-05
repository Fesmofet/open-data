/** @jest-environment jsdom */

import { buildHasAuthDeepLink } from './has-deep-link';

describe('buildHasAuthDeepLink', () => {
  it('builds has:// auth_req URI with base64 payload', () => {
    const link = buildHasAuthDeepLink({
      account: 'alice',
      uuid: '9b0e2dc3-f574-4766-abdd-c429dce11284',
      key: '03f63469-5a35-47cb-a6b4-e8c4d3144cf9',
      host: 'wss://hive-auth.arcange.eu',
    });

    expect(link.startsWith('has://auth_req/')).toBe(true);
    const base64 = link.replace('has://auth_req/', '');
    const decoded = JSON.parse(Buffer.from(base64, 'base64').toString('utf8')) as {
      account: string;
      uuid: string;
      key: string;
      host: string;
    };
    expect(decoded).toEqual({
      account: 'alice',
      uuid: '9b0e2dc3-f574-4766-abdd-c429dce11284',
      key: '03f63469-5a35-47cb-a6b4-e8c4d3144cf9',
      host: 'wss://hive-auth.arcange.eu',
    });
  });
});
