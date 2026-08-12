/** @jest-environment node */

import { decodeHasAuthCompactFragment } from './has-compact-link';

/**
 * Vectors produced by the encoder in `libs/hive-auth/src/has-compact-link.ts`.
 * Keep them in sync with `libs/hive-auth/src/has-compact-link.spec.ts` — if the
 * two codecs ever drift apart, one of the two suites fails.
 */
const KNOWN_HOST_PAYLOAD = {
  account: 'flowmaster',
  uuid: '0f2b7c1e-8a3d-4c55-9b21-6d0e5f4a7c39',
  key: '3d9e1a44-2c07-4f88-b6e5-71a2c8d0459b',
  host: 'wss://hive-auth.arcange.eu',
};

const KNOWN_HOST_FRAGMENT =
  '1AA8rfB6KPUxVmyFtDl9KfDk9nhpELAdPiLblcaLI0EWbZmxvd21hc3Rlcg';

describe('has-compact-link (web decoder)', () => {
  it('decodes a fragment built for a known host', () => {
    expect(decodeHasAuthCompactFragment(KNOWN_HOST_FRAGMENT)).toEqual(
      KNOWN_HOST_PAYLOAD,
    );
  });

  it('carries no JWT-shaped prefix', () => {
    expect(KNOWN_HOST_FRAGMENT).not.toContain('eyJ');
  });

  it('returns null for a legacy base64-of-json fragment', () => {
    const legacy = btoa(JSON.stringify(KNOWN_HOST_PAYLOAD));
    expect(decodeHasAuthCompactFragment(legacy)).toBeNull();
  });

  it('returns null for malformed compact fragments', () => {
    expect(decodeHasAuthCompactFragment('1')).toBeNull();
    expect(decodeHasAuthCompactFragment('1***')).toBeNull();
    expect(
      decodeHasAuthCompactFragment(KNOWN_HOST_FRAGMENT.slice(0, 20)),
    ).toBeNull();
  });
});
