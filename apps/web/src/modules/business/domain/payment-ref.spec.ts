import {
  extractPaymentRefNote,
  getPartialRemainderSourceId,
  parsePaymentRefAuthorperm,
} from './payment-ref';

describe('extractPaymentRefNote', () => {
  it('returns note, memo, or report from user ref', () => {
    expect(extractPaymentRefNote({ note: 'Bank transfer' })).toBe('Bank transfer');
    expect(extractPaymentRefNote({ memo: 'Invoice #12' })).toBe('Invoice #12');
    expect(extractPaymentRefNote({ report: 'https://example.com/report' })).toBe(
      'https://example.com/report',
    );
  });

  it('prefers note over memo and report', () => {
    expect(
      extractPaymentRefNote({
        note: 'Primary',
        memo: 'Secondary',
        report: 'https://example.com',
      }),
    ).toBe('Primary');
  });

  it('ignores system-only refs', () => {
    expect(extractPaymentRefNote({ excess_confirm: true })).toBeNull();
    expect(extractPaymentRefNote({ partial_remainder_of: 'pay-1' })).toBeNull();
    expect(extractPaymentRefNote({ receiver_only_confirm: true })).toBeNull();
  });

  it('returns note from refs that also include system keys', () => {
    expect(
      extractPaymentRefNote({
        receiver_only_confirm: true,
        note: 'Bank transfer receipt',
      }),
    ).toBe('Bank transfer receipt');
  });

  it('returns null for empty or missing ref', () => {
    expect(extractPaymentRefNote(null)).toBeNull();
    expect(extractPaymentRefNote({})).toBeNull();
    expect(extractPaymentRefNote({ note: '   ' })).toBeNull();
  });
});

describe('parsePaymentRefAuthorperm', () => {
  it('parses @author/permlink', () => {
    expect(parsePaymentRefAuthorperm({ authorperm: '@alice/my-post' })).toEqual({
      author: 'alice',
      permlink: 'my-post',
    });
  });

  it('parses author/permlink without @', () => {
    expect(parsePaymentRefAuthorperm({ authorperm: 'bob/some-slug' })).toEqual({
      author: 'bob',
      permlink: 'some-slug',
    });
  });

  it('returns null for invalid authorperm', () => {
    expect(parsePaymentRefAuthorperm(null)).toBeNull();
    expect(parsePaymentRefAuthorperm({})).toBeNull();
    expect(parsePaymentRefAuthorperm({ authorperm: 'alice' })).toBeNull();
    expect(parsePaymentRefAuthorperm({ authorperm: '@alice/' })).toBeNull();
  });
});

describe('getPartialRemainderSourceId', () => {
  it('returns trimmed partial_remainder_of id', () => {
    expect(getPartialRemainderSourceId({ partial_remainder_of: 'pay-abc' })).toBe('pay-abc');
    expect(getPartialRemainderSourceId({ partial_remainder_of: '  pay-xyz  ' })).toBe('pay-xyz');
  });

  it('returns null for missing or invalid partial_remainder_of', () => {
    expect(getPartialRemainderSourceId(null)).toBeNull();
    expect(getPartialRemainderSourceId({})).toBeNull();
    expect(getPartialRemainderSourceId({ partial_remainder_of: '' })).toBeNull();
    expect(getPartialRemainderSourceId({ partial_remainder_of: '   ' })).toBeNull();
    expect(getPartialRemainderSourceId({ partial_remainder_of: 42 })).toBeNull();
  });
});
