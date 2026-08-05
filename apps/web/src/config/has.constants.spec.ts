import {
  buildHasWsUrlCandidates,
  DEFAULT_HAS_WS_URL,
  normalizeHasWsUrl,
} from '@/config/has.constants';

describe('has.constants', () => {
  it('defaults to the arcange HAS server', () => {
    expect(DEFAULT_HAS_WS_URL).toBe('wss://hive-auth.arcange.eu');
  });

  it('builds deduplicated candidate list with preferred URL first', () => {
    expect(buildHasWsUrlCandidates('wss://has.hiveauth.com')).toEqual([
      'wss://has.hiveauth.com',
      'wss://hive-auth.arcange.eu',
    ]);
  });

  it('normalizes websocket URLs with trailing slash for the wrapper', () => {
    expect(normalizeHasWsUrl('wss://hive-auth.arcange.eu')).toBe(
      'wss://hive-auth.arcange.eu/',
    );
  });
});
