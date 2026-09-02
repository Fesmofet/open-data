import { CHANNEL_KINDS } from '@opden-data-layer/core';

import {
  ORIGINAL_CREATED_AT_MAX_FUTURE_SEC,
  resolveOriginalCreatedAtUnix,
} from './resolve-original-created-at-unix';

describe('resolveOriginalCreatedAtUnix', () => {
  const NOW = 1_700_000_000;
  const STAMP_2010 = 1_262_304_000;

  it('returns null for non-object channels', () => {
    expect(
      resolveOriginalCreatedAtUnix({
        channelKind: CHANNEL_KINDS[0],
        stamp: STAMP_2010,
        nowUnix: NOW,
      }),
    ).toBeNull();
  });

  it('returns null when stamp is omitted', () => {
    expect(
      resolveOriginalCreatedAtUnix({
        channelKind: CHANNEL_KINDS[2],
        stamp: undefined,
        nowUnix: NOW,
      }),
    ).toBeNull();
  });

  it('persists in-range stamp on object channels', () => {
    expect(
      resolveOriginalCreatedAtUnix({
        channelKind: CHANNEL_KINDS[2],
        stamp: STAMP_2010,
        nowUnix: NOW,
      }),
    ).toBe(STAMP_2010);
  });

  it('accepts lower bound 1', () => {
    expect(
      resolveOriginalCreatedAtUnix({
        channelKind: CHANNEL_KINDS[2],
        stamp: 1,
        nowUnix: NOW,
      }),
    ).toBe(1);
  });

  it('rejects 0', () => {
    expect(
      resolveOriginalCreatedAtUnix({
        channelKind: CHANNEL_KINDS[2],
        stamp: 0,
        nowUnix: NOW,
      }),
    ).toBeNull();
  });

  it('accepts now plus max future window', () => {
    expect(
      resolveOriginalCreatedAtUnix({
        channelKind: CHANNEL_KINDS[2],
        stamp: NOW + ORIGINAL_CREATED_AT_MAX_FUTURE_SEC,
        nowUnix: NOW,
      }),
    ).toBe(NOW + ORIGINAL_CREATED_AT_MAX_FUTURE_SEC);
  });

  it('rejects beyond max future window', () => {
    expect(
      resolveOriginalCreatedAtUnix({
        channelKind: CHANNEL_KINDS[2],
        stamp: NOW + ORIGINAL_CREATED_AT_MAX_FUTURE_SEC + 1,
        nowUnix: NOW,
      }),
    ).toBeNull();
  });
});
