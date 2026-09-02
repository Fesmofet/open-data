import {
  canViewerAttemptDecryptMessage,
  formatActivityMessageCaption,
  formatActivityMessageTime,
  resolveMessagePresentation,
} from './messaging.helpers';
import type { MessageItem } from './messaging.types';

const baseMessage: Pick<MessageItem, 'body' | 'encryption' | 'author' | 'overflow_ref'> = {
  body: null,
  encryption: null,
  author: 'alice',
  overflow_ref: null,
};

describe('resolveMessagePresentation', () => {
  it('returns plain text for unencrypted messages', () => {
    expect(
      resolveMessagePresentation(
        { ...baseMessage, body: 'hello' },
        'bob',
        null,
      ),
    ).toEqual({ kind: 'plain', text: 'hello' });
  });

  it('returns decrypted when cache is present', () => {
    expect(
      resolveMessagePresentation(
        {
          ...baseMessage,
          encryption: { v: 1, mode: 'memo', to: 'bob' },
        },
        'bob',
        'secret',
      ),
    ).toEqual({ kind: 'decrypted', text: 'secret' });
  });

  it('returns one-way for ephemeral outgoing messages', () => {
    expect(
      resolveMessagePresentation(
        {
          ...baseMessage,
          author: 'alice',
          encryption: { v: 1, mode: 'ephemeral', to: 'bob' },
        },
        'alice',
        null,
      ),
    ).toEqual({ kind: 'one-way', to: 'bob' });
  });

  it('returns encrypted clickable for incoming encrypted messages', () => {
    expect(
      resolveMessagePresentation(
        {
          ...baseMessage,
          author: 'alice',
          encryption: { v: 1, mode: 'memo', to: 'bob' },
        },
        'bob',
        null,
      ),
    ).toEqual({ kind: 'encrypted', clickable: true });
  });

  it('returns encrypted clickable for outgoing memo messages', () => {
    expect(
      resolveMessagePresentation(
        {
          ...baseMessage,
          author: 'fesmofet',
          encryption: { v: 1, mode: 'memo', to: 'new-way' },
        },
        'fesmofet',
        null,
      ),
    ).toEqual({ kind: 'encrypted', clickable: true });
  });
});

describe('canViewerAttemptDecryptMessage', () => {
  const memoToNewWay = {
    author: 'fesmofet',
    encryption: { v: 1, mode: 'memo' as const, to: 'new-way' },
  };

  it('allows memo-mode sender to decrypt own message', () => {
    expect(canViewerAttemptDecryptMessage(memoToNewWay, 'fesmofet')).toBe(true);
  });

  it('allows memo-mode recipient to decrypt', () => {
    expect(canViewerAttemptDecryptMessage(memoToNewWay, 'new-way')).toBe(true);
  });

  it('blocks ephemeral-mode sender', () => {
    expect(
      canViewerAttemptDecryptMessage(
        {
          author: 'fesmofet',
          encryption: { v: 1, mode: 'ephemeral', to: 'new-way' },
        },
        'fesmofet',
      ),
    ).toBe(false);
  });

  it('blocks group bystander', () => {
    expect(canViewerAttemptDecryptMessage(memoToNewWay, 'charlie')).toBe(false);
  });
});

describe('formatActivityMessageTime', () => {
  it('uses original stamp as full date+time when present', () => {
    const caption = formatActivityMessageTime(
      { created_at_unix: 1_700_000_000, original_created_at_unix: 1_262_304_000 },
      'en-US',
    );
    expect(caption).toContain('2010');
  });

  it('uses created time only when stamp is absent', () => {
    const caption = formatActivityMessageTime(
      { created_at_unix: 1_700_000_000, original_created_at_unix: null },
      'en-US',
    );
    expect(caption).not.toContain('2023');
    expect(caption).toMatch(/\d/);
  });
});

describe('formatActivityMessageCaption', () => {
  it('prefixes originally label when stamp is present', () => {
    const caption = formatActivityMessageCaption(
      { created_at_unix: 1_700_000_000, original_created_at_unix: 1_262_304_000 },
      'en-US',
      'Originally {datetime}',
    );
    expect(caption).toContain('Originally');
    expect(caption).toContain('2010');
  });
});
