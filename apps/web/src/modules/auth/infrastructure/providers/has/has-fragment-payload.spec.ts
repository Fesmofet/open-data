/** @jest-environment node */

import {
  buildHasAuthDeepLinkFromPayloadBase64,
  encodeHasAuthPayloadBase64,
  parseHasAuthFragmentPayload,
} from './has-fragment-payload';

const validPayload = {
  account: 'alice',
  uuid: '9b0e2dc3-f574-4766-abdd-c429dce11284',
  key: '03f63469-5a35-47cb-a6b4-e8c4d3144cf9',
  host: 'wss://hive-auth.arcange.eu',
};

const compactPayload = {
  account: 'flowmaster',
  uuid: '0f2b7c1e-8a3d-4c55-9b21-6d0e5f4a7c39',
  key: '3d9e1a44-2c07-4f88-b6e5-71a2c8d0459b',
  host: 'wss://hive-auth.arcange.eu',
};

const compactFragment =
  '1AA8rfB6KPUxVmyFtDl9KfDk9nhpELAdPiLblcaLI0EWbZmxvd21hc3Rlcg';

describe('has-fragment-payload', () => {
  it('parses the compact fragment emitted by agent-wallet', () => {
    expect(parseHasAuthFragmentPayload(`#${compactFragment}`)).toEqual(
      compactPayload,
    );
  });

  it('still parses the legacy fragment from already released binaries', () => {
    const legacy = encodeHasAuthPayloadBase64(compactPayload);
    expect(legacy.startsWith('eyJ')).toBe(true);
    expect(parseHasAuthFragmentPayload(`#${legacy}`)).toEqual(compactPayload);
  });

  it('rejects a compact fragment pointing at a non-wss host', () => {
    const inlineHttpHost = `1${Buffer.from(
      Buffer.concat([
        Buffer.of(255, 'http://evil.example'.length),
        Buffer.from('http://evil.example', 'ascii'),
        Buffer.from(compactPayload.uuid.replace(/-/g, ''), 'hex'),
        Buffer.from(compactPayload.key.replace(/-/g, ''), 'hex'),
        Buffer.from('flowmaster', 'ascii'),
      ]),
    ).toString('base64url')}`;
    expect(() => parseHasAuthFragmentPayload(`#${inlineHttpHost}`)).toThrow(
      'invalid',
    );
  });

  it('round-trips valid payload through base64 fragment', () => {
    const base64 = encodeHasAuthPayloadBase64(validPayload);
    expect(parseHasAuthFragmentPayload(`#${base64}`)).toEqual(validPayload);
    expect(buildHasAuthDeepLinkFromPayloadBase64(base64)).toBe(
      `has://auth_req/${base64}`,
    );
  });

  it('rejects missing fragment', () => {
    expect(() => parseHasAuthFragmentPayload('')).toThrow('missing');
    expect(() => parseHasAuthFragmentPayload('#')).toThrow('missing');
  });

  it('rejects invalid base64/json', () => {
    expect(() => parseHasAuthFragmentPayload('#not-base64-json')).toThrow(
      'invalid',
    );
    expect(() =>
      parseHasAuthFragmentPayload(
        `#${Buffer.from('not-json', 'utf8').toString('base64')}`,
      ),
    ).toThrow('invalid');
  });

  it('rejects payload missing required fields or invalid host', () => {
    const missingUuid = encodeHasAuthPayloadBase64({
      ...validPayload,
      uuid: '',
    });
    expect(() => parseHasAuthFragmentPayload(`#${missingUuid}`)).toThrow(
      'invalid',
    );

    const badHost = encodeHasAuthPayloadBase64({
      ...validPayload,
      host: 'https://evil.example',
    });
    expect(() => parseHasAuthFragmentPayload(`#${badHost}`)).toThrow(
      'invalid',
    );
  });
});
