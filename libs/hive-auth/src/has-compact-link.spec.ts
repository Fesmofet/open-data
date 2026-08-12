import {
  decodeHasAuthCompactFragment,
  encodeHasAuthCompactFragment,
} from './has-compact-link';

const KNOWN_HOST_PAYLOAD = {
  account: 'flowmaster',
  uuid: '0f2b7c1e-8a3d-4c55-9b21-6d0e5f4a7c39',
  key: '3d9e1a44-2c07-4f88-b6e5-71a2c8d0459b',
  host: 'wss://hive-auth.arcange.eu',
};

/**
 * Pinned so that the browser decoder in
 * `apps/web/src/modules/auth/infrastructure/providers/has/has-compact-link.spec.ts`
 * checks the very same bytes. If the two codecs drift apart, one suite fails.
 */
const KNOWN_HOST_FRAGMENT =
  '1AA8rfB6KPUxVmyFtDl9KfDk9nhpELAdPiLblcaLI0EWbZmxvd21hc3Rlcg';

describe('has compact link', () => {
  it('round-trips a payload on a known host', () => {
    const fragment = encodeHasAuthCompactFragment(KNOWN_HOST_PAYLOAD);
    expect(fragment).toBe(KNOWN_HOST_FRAGMENT);
    expect(decodeHasAuthCompactFragment(fragment as string)).toEqual(
      KNOWN_HOST_PAYLOAD,
    );
  });

  it('round-trips a payload on an inline host', () => {
    const payload = { ...KNOWN_HOST_PAYLOAD, host: 'ws://127.0.0.1:17500' };
    const fragment = encodeHasAuthCompactFragment(payload);
    expect(fragment).not.toBeNull();
    expect(decodeHasAuthCompactFragment(fragment as string)).toEqual(payload);
  });

  it('never produces a JWT-shaped fragment and stays short', () => {
    const fragment = encodeHasAuthCompactFragment(KNOWN_HOST_PAYLOAD) as string;
    expect(fragment.startsWith('1')).toBe(true);
    expect(fragment).not.toContain('eyJ');
    expect(fragment.length).toBeLessThanOrEqual(64);
  });

  it('returns null when uuid or key is not a uuid', () => {
    expect(
      encodeHasAuthCompactFragment({ ...KNOWN_HOST_PAYLOAD, uuid: 'not-a-uuid' }),
    ).toBeNull();
    expect(
      encodeHasAuthCompactFragment({ ...KNOWN_HOST_PAYLOAD, key: 'not-a-uuid' }),
    ).toBeNull();
  });

  it('returns null for a non-ascii account', () => {
    expect(
      encodeHasAuthCompactFragment({ ...KNOWN_HOST_PAYLOAD, account: 'флоу' }),
    ).toBeNull();
  });

  it('rejects fragments that are not compact-v1', () => {
    expect(decodeHasAuthCompactFragment('eyJhY2NvdW50IjoiYSJ9')).toBeNull();
    expect(decodeHasAuthCompactFragment('1')).toBeNull();
    expect(decodeHasAuthCompactFragment('1!!!')).toBeNull();
  });

  it('rejects a truncated compact fragment', () => {
    const fragment = encodeHasAuthCompactFragment(KNOWN_HOST_PAYLOAD) as string;
    expect(decodeHasAuthCompactFragment(fragment.slice(0, 20))).toBeNull();
  });

  it('rejects an unknown host index', () => {
    expect(decodeHasAuthCompactFragment(`1${Buffer.from(
      Uint8Array.of(7, ...new Uint8Array(33)),
    ).toString('base64url')}`)).toBeNull();
  });
});
