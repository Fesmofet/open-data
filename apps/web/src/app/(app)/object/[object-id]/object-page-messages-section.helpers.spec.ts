import { resolveObjectMessagesSectionProps } from './object-page-messages-section.helpers';

describe('resolveObjectMessagesSectionProps', () => {
  const base = {
    objectId: 'obj-1',
    objectName: 'My Shop',
    viewerUsername: 'alice',
  };

  it('builds synthetic channel when query returns null', () => {
    const props = resolveObjectMessagesSectionProps({
      ...base,
      channel: null,
    });

    expect(props.channel.channel_id).toBe('obj-ch-obj-1');
    expect(props.channel.kind).toBe('object');
    expect(props.initialMessages.items).toEqual([]);
  });

  it('keeps fetched messages when channel is missing', () => {
    const initialMessages = {
      items: [
        {
          message_id: 'm1',
          channel_id: 'obj-ch-rest',
          author: 'alice',
          body: 'mention',
          overflow_ref: null,
          reply_to: null,
          quote_json: null,
          attachments: null,
          mentions: [],
          created_at_unix: 1,
          source_object: {
            object_id: 'rest-1',
            name: 'The Broken Whisk',
          },
        },
      ],
      cursor: null,
      hasMore: false,
    };

    const props = resolveObjectMessagesSectionProps({
      ...base,
      channel: null,
      initialMessages,
    });

    expect(props.initialMessages.items).toHaveLength(1);
  });

  it('passes existing channel and messages', () => {
    const channel = {
      channel_id: 'obj-ch-obj-1',
      kind: 'object',
      creator: 'alice',
      title: 'My Shop',
      image: null,
      object_id: 'obj-1',
      access: 'members_only',
      display_title: 'My Shop',
      list_title: null,
      peer: null,
      members: [],
    };
    const initialMessages = {
      items: [
        {
          message_id: 'm1',
          channel_id: 'obj-ch-obj-1',
          author: 'alice',
          body: 'hi',
          overflow_ref: null,
          reply_to: null,
          quote_json: null,
          attachments: null,
          mentions: [],
          created_at_unix: 1,
        },
      ],
      cursor: null,
      hasMore: false,
    };

    const props = resolveObjectMessagesSectionProps({
      ...base,
      channel,
      initialMessages,
    });

    expect(props.channel).toBe(channel);
    expect(props.initialMessages).toBe(initialMessages);
  });
});
