import {
  decodeActivityCursor,
  encodeActivityCursor,
} from './activity-cursor';

describe('activity-cursor', () => {
  it('round-trips operation index', () => {
    const encoded = encodeActivityCursor({ operationIndex: 58167 });
    expect(decodeActivityCursor(encoded)).toEqual({ operationIndex: 58167 });
  });

  it('returns null for tampered base64', () => {
    expect(decodeActivityCursor('not-valid-cursor')).toBeNull();
  });

  it('returns null for valid base64 with invalid payload', () => {
    const encoded = Buffer.from(JSON.stringify({ foo: 1 }), 'utf8').toString(
      'base64url',
    );
    expect(decodeActivityCursor(encoded)).toBeNull();
  });

  it('returns null for negative operation index', () => {
    const encoded = encodeActivityCursor({ operationIndex: -1 });
    expect(decodeActivityCursor(encoded)).toBeNull();
  });
});
