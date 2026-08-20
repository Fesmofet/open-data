import {
  buildDmChannelId,
  buildObjectChannelId,
} from './osl-messaging';
import { computeDmPairHash } from './osl-messaging-crypto';

describe('osl-messaging utils', () => {
  it('computeDmPairHash is order-independent', () => {
    const a = computeDmPairHash(['alice', 'bob']);
    const b = computeDmPairHash(['bob', 'alice']);
    expect(a).toBe(b);
    expect(buildDmChannelId(a)).toBe(`dm-${a}`);
  });

  it('buildObjectChannelId is deterministic per object', () => {
    expect(buildObjectChannelId('abc123')).toBe('obj-ch-abc123');
  });

  it('buildObjectChannelId preserves encoded object ids', () => {
    expect(buildObjectChannelId('obj-1_with-dash')).toBe('obj-ch-obj-1_with-dash');
    expect(buildObjectChannelId('obj-1_with-dash').length).toBeLessThanOrEqual(256);
  });
});
