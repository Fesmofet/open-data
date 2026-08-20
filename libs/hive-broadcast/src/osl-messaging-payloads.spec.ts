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
