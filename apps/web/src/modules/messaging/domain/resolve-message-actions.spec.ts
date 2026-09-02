import { resolveMessageActions } from './resolve-message-actions';
import type { MessageItem } from './messaging.types';

function msg(
  overrides: Partial<MessageItem> & Pick<MessageItem, 'author'>,
): MessageItem {
  return {
    message_id: 'm1',
    channel_id: 'ch-1',
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
    ...overrides,
  };
}

describe('resolveMessageActions', () => {
  it('own plaintext gets all four actions', () => {
    expect(resolveMessageActions(msg({ author: 'alice' }), 'alice')).toEqual({
      edit: true,
      delete: true,
      copy: true,
      reply: true,
    });
  });

  it('other plaintext gets copy and reply only', () => {
    expect(resolveMessageActions(msg({ author: 'bob' }), 'alice')).toEqual({
      edit: false,
      delete: false,
      copy: true,
      reply: true,
    });
  });

  it('own encrypted gets delete only', () => {
    expect(
      resolveMessageActions(
        msg({
          author: 'alice',
          body: null,
          encrypted_body: '#cipher',
          encryption: { v: 1, mode: 'memo', to: 'bob' },
        }),
        'alice',
      ),
    ).toEqual({
      edit: false,
      delete: true,
      copy: false,
      reply: false,
    });
  });

  it('other encrypted gets no actions', () => {
    expect(
      resolveMessageActions(
        msg({
          author: 'bob',
          body: null,
          encrypted_body: '#cipher',
          encryption: { v: 1, mode: 'memo', to: 'alice' },
        }),
        'alice',
      ),
    ).toEqual({
      edit: false,
      delete: false,
      copy: false,
      reply: false,
    });
  });

  it('ignores channel kind — same flags for direct and object messages', () => {
    const direct = msg({ author: 'bob', channel_id: 'dm-1' });
    const object = msg({ author: 'bob', channel_id: 'obj-ch-1' });
    expect(resolveMessageActions(direct, 'alice')).toEqual(
      resolveMessageActions(object, 'alice'),
    );
  });

  it('does not unlock copy or reply when only decrypted cache would show text', () => {
    expect(
      resolveMessageActions(
        msg({
          author: 'bob',
          body: null,
          encrypted_body: '#cipher',
          encryption: { v: 1, mode: 'memo', to: 'alice' },
        }),
        'alice',
      ),
    ).toEqual({
      edit: false,
      delete: false,
      copy: false,
      reply: false,
    });
  });
});
