/** @jest-environment jsdom */

import { createKeychainSigner } from './keychain-signer';

describe('createKeychainSigner', () => {
  it('resolves signing account for account_update and requests Active key', async () => {
    const requestBroadcast = jest.fn(
      (_account: string, _ops: unknown, key: string, cb: (r: { success: boolean; result: { id: string } }) => void) => {
        cb({ success: true, result: { id: 'abc123def4567890123456789012345678901234' } });
      },
    );
    (window as Window & { hive_keychain?: { requestBroadcast?: unknown } }).hive_keychain = {
      requestBroadcast,
    };

    const signer = createKeychainSigner();
    const result = await signer.sign({
      operations: [
        {
          type: 'account_update',
          account: 'alice',
          memo_key: 'STM8test',
          json_metadata: '{}',
          posting: {
            weight_threshold: 1,
            account_auths: [['bob', 1]],
            key_auths: [],
          },
        },
      ],
    });

    expect(requestBroadcast).toHaveBeenCalledWith(
      'alice',
      expect.any(Array),
      'Active',
      expect.any(Function),
    );
    expect(result.transactionId).toBe('abc123def4567890123456789012345678901234');
  });
});
