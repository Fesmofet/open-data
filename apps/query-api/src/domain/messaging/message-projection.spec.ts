import { mapMessageToDto, resolveLastMessagePreview } from './message-projection';

describe('message-projection', () => {
  it('maps encrypted row to MessageDto with encryption object', () => {
    const dto = mapMessageToDto({
      message_id: 'm1',
      channel_id: 'c1',
      author: 'alice',
      body: null,
      encrypted_body: '#Ab3xYz',
      encryption_mode: 'memo',
      encrypted_to: 'bob',
      encryption_v: 1,
      encryption_meta: null,
      overflow_ref: null,
      reply_to: null,
      quote_json: null,
      attachments: null,
      mentions: [],
      original_created_at_unix: 1_262_304_000,
      updated_at_unix: null,
      created_at_unix: 100,
      event_seq: BigInt(1),
      transaction_id: 'tx1',
      search_vector: null,
    });
    expect(dto.encryption).toEqual({ v: 1, mode: 'memo', to: 'bob' });
    expect(dto.encrypted_body).toBe('#Ab3xYz');
    expect(dto.body).toBeNull();
    expect(dto.original_created_at_unix).toBe(1_262_304_000);
    expect(dto).not.toHaveProperty('updated_at_unix');
  });

  it('resolveLastMessagePreview returns encrypted flag without ciphertext', () => {
    expect(
      resolveLastMessagePreview({
        body: null,
        overflow_ref: null,
        encryption_mode: 'ephemeral',
      }),
    ).toEqual({ preview: null, encrypted: true });
  });

  it('resolveLastMessagePreview returns plain body', () => {
    expect(
      resolveLastMessagePreview({
        body: 'hello',
        overflow_ref: null,
        encryption_mode: null,
      }),
    ).toEqual({ preview: 'hello', encrypted: false });
  });
});
