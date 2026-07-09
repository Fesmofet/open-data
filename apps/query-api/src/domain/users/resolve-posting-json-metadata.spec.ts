import { resolvePostingJsonMetadata } from './resolve-posting-json-metadata';

describe('resolvePostingJsonMetadata', () => {
  it('prefers non-empty chain metadata over db', () => {
    expect(
      resolvePostingJsonMetadata(
        '{"profile":{"about":"stale"}}',
        '{"profile":{"about":"live"}}',
      ),
    ).toBe('{"profile":{"about":"live"}}');
  });

  it('falls back to db when chain is empty', () => {
    expect(resolvePostingJsonMetadata('{"profile":{"about":"db"}}', '')).toBe(
      '{"profile":{"about":"db"}}',
    );
    expect(resolvePostingJsonMetadata('{"profile":{"about":"db"}}', null)).toBe(
      '{"profile":{"about":"db"}}',
    );
  });

  it('returns null when both are empty', () => {
    expect(resolvePostingJsonMetadata(null, undefined)).toBeNull();
    expect(resolvePostingJsonMetadata('  ', '  ')).toBeNull();
  });
});
