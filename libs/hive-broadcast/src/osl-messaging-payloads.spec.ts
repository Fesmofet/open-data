import {
  buildEncryptedMessageCreatePayload,
  buildGroupChannelCreatePayload,
  buildMessageCreatePayload,
  buildObjectChannelCreatePayload,
  generateGroupChannelId,
} from './osl-messaging-payloads';

describe('osl-messaging-payloads', () => {
  it('generateGroupChannelId returns grp- prefixed uuid', () => {
    const id = generateGroupChannelId();
    expect(id.startsWith('grp-')).toBe(true);
    expect(id.length).toBeLessThanOrEqual(256);
  });

  it('buildGroupChannelCreatePayload excludes viewer from members', () => {
    expect(
      buildGroupChannelCreatePayload({
        channelId: 'grp-1',
        members: ['Alice', ' bob ', 'alice'],
        viewerUsername: 'alice',
        title: ' Ops ',
      }),
    ).toEqual({
      kind: 'group',
      channel_id: 'grp-1',
      members: ['bob'],
      title: 'Ops',
    });
  });

  it('buildObjectChannelCreatePayload uses deterministic channel id', () => {
    const payload = buildObjectChannelCreatePayload({
      objectId: 'product-1',
      objectName: 'Widget',
    });
    expect(payload['kind']).toBe('object');
    expect(payload['object_id']).toBe('product-1');
    expect(payload['title']).toBe('Widget');
    expect(typeof payload['channel_id']).toBe('string');
  });

  it('buildMessageCreatePayload requires channelId or peer', () => {
    expect(() => buildMessageCreatePayload({ body: 'hi' })).toThrow(
      'channelId or peer is required',
    );
    expect(buildMessageCreatePayload({ peer: 'bob', body: ' hi ' })).toEqual({
      peer: 'bob',
      body: 'hi',
    });
  });

  it('omits original_created_at_unix when unset', () => {
    expect(
      buildMessageCreatePayload({ channelId: 'obj-ch-1', body: 'hello' }),
    ).toEqual({
      channel_id: 'obj-ch-1',
      body: 'hello',
    });
  });

  it('includes original_created_at_unix as integer seconds', () => {
    expect(
      buildMessageCreatePayload({
        channelId: 'obj-ch-1',
        body: 'hello',
        originalCreatedAtUnix: 1_262_304_000,
      }),
    ).toEqual({
      channel_id: 'obj-ch-1',
      body: 'hello',
      original_created_at_unix: 1_262_304_000,
    });
  });

  it('never emits updated_at_unix', () => {
    const payload = buildMessageCreatePayload({
      channelId: 'obj-ch-1',
      body: 'hello',
      originalCreatedAtUnix: 1_262_304_000,
    });
    expect(payload).not.toHaveProperty('updated_at_unix');
  });

  it('buildEncryptedMessageCreatePayload adds encryption metadata', () => {
    expect(
      buildEncryptedMessageCreatePayload({
        channelId: 'grp-1',
        ciphertext: '#AbC',
        mode: 'memo',
        to: 'bob',
      }),
    ).toEqual({
      channel_id: 'grp-1',
      encrypted_body: '#AbC',
      encryption: { v: 1, mode: 'memo', to: 'bob' },
    });
  });
});
