import {
  canViewerAttemptDecryptMessage,
  buildReplyQuoteJson,
  formatActivityMessageCaption,
  formatActivityMessageTime,
  formatMessageTimeCaption,
  messageCopyText,
  resolveMessagePresentation,
  resolveMessageQuotePreview,
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

  it('shows original caption and edited label when both stamps are set', () => {
    const caption = formatActivityMessageCaption(
      {
        created_at_unix: 1_700_000_000,
        original_created_at_unix: 1_262_304_000,
        updated_at_unix: 1_700_000_100,
      },
      'en-US',
      'Originally {datetime}',
      'edited',
    );
    expect(caption).toContain('Originally');
    expect(caption).toContain('2010');
    expect(caption).toContain('edited');
  });
});

describe('formatMessageTimeCaption', () => {
  it('shows edited label only when updated_at_unix is set', () => {
    const createdAtUnix = 1_700_000_000;
    const withoutEdit = formatMessageTimeCaption(createdAtUnix, 'en-US', null, 'edited');
    const withEdit = formatMessageTimeCaption(
      createdAtUnix,
      'en-US',
      1_700_000_100,
      'edited',
    );

    expect(withoutEdit).not.toContain('edited');
    expect(withEdit).toContain('edited');
    expect(withEdit.startsWith(withoutEdit)).toBe(true);
  });
});

describe('resolveMessageQuotePreview', () => {
  const parent: MessageItem = {
    message_id: 'parent-0-0-0',
    channel_id: 'ch-1',
    author: 'bob',
    body: 'hello',
    encrypted_body: null,
    encryption: null,
    overflow_ref: null,
    reply_to: null,
    quote_json: null,
    attachments: null,
    mentions: [],
    created_at_unix: 1_700_000_000,
    original_created_at_unix: null,
    updated_at_unix: null,
  };

  it('prefers live parent in page', () => {
    const messagesById = new Map([[parent.message_id, parent]]);
    expect(
      resolveMessageQuotePreview(
        { reply_to: 'parent-0-0-0', quote_json: null },
        messagesById,
      ),
    ).toEqual({ author: 'bob', body: 'hello', deleted: false });
  });

  it('falls back to quote_json when parent is not loaded', () => {
    expect(
      resolveMessageQuotePreview(
        {
          reply_to: 'parent-0-0-0',
          quote_json: { author: 'bob', body: 'hello' },
        },
        new Map(),
      ),
    ).toEqual({ author: 'bob', body: 'hello', deleted: false });
  });

  it('returns deleted placeholder when parent and quote_json are gone', () => {
    expect(
      resolveMessageQuotePreview(
        { reply_to: 'parent-0-0-0', quote_json: null },
        new Map(),
      ),
    ).toEqual({ author: '', body: '', deleted: true });
  });
});

describe('messageCopyText', () => {
  it('returns plaintext body for copy', () => {
    expect(messageCopyText({ body: 'hello', overflow_ref: null })).toBe('hello');
  });

  it('returns null when body is empty', () => {
    expect(messageCopyText({ body: null, overflow_ref: null })).toBeNull();
  });
});

describe('buildReplyQuoteJson', () => {
  it('captures author and full body for reply snapshot', () => {
    expect(
      buildReplyQuoteJson({ author: 'bob', body: 'hello', overflow_ref: null }),
    ).toEqual({ author: 'bob', body: 'hello' });
  });
});
