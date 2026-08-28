import { buildHiveEngineTokensOp } from '@opden-data-layer/hive-broadcast';
import type { HiveOperation } from '@opden-data-layer/hive-broadcast';

import {
  hiveOperationRequiresActiveKey,
  hivePayloadRequiresActiveKey,
  resolveKeychainBroadcastKey,
} from './hive-operation-signing';

describe('hive-operation-signing', () => {
  it('detects Hive Engine token ops as active-key', () => {
    const op = buildHiveEngineTokensOp({
      account: 'alice',
      contractAction: 'transfer',
      payload: { symbol: 'WAIV', quantity: '1', to: 'bob' },
    });
    expect(hiveOperationRequiresActiveKey(op)).toBe(true);
    expect(hivePayloadRequiresActiveKey([op])).toBe(true);
    expect(resolveKeychainBroadcastKey([op])).toBe('Active');
  });

  it('keeps posting key for ODL posting custom_json', () => {
    const op: HiveOperation = {
      type: 'custom_json',
      required_auths: [],
      required_posting_auths: ['alice'],
      id: 'follow',
      json: '[]',
    };
    expect(hiveOperationRequiresActiveKey(op)).toBe(false);
    expect(resolveKeychainBroadcastKey([op])).toBe('Posting');
  });

  it('keeps posting key for claim_reward_balance', () => {
    const op: HiveOperation = {
      type: 'claim_reward_balance',
      account: 'alice',
      reward_hive: '0.734 HIVE',
      reward_hbd: '0.012 HBD',
      reward_vests: '123.456789 VESTS',
    };
    expect(hiveOperationRequiresActiveKey(op)).toBe(false);
    expect(resolveKeychainBroadcastKey([op])).toBe('Posting');
  });

  it('requires active key for collateralized_convert', () => {
    const op: HiveOperation = {
      type: 'collateralized_convert',
      owner: 'alice',
      requestid: 1_700_000_000,
      amount: '1.200 HIVE',
    };
    expect(hiveOperationRequiresActiveKey(op)).toBe(true);
    expect(resolveKeychainBroadcastKey([op])).toBe('Active');
  });
});
