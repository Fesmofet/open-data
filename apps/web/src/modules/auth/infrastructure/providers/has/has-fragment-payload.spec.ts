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

describe('has-fragment-payload', () => {
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
