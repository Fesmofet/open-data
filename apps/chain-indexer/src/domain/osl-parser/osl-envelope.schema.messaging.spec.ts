import { messageCreatePayloadSchema } from './osl-envelope.schema';

describe('messageCreatePayloadSchema', () => {
  it('accepts peer bootstrap with body', () => {
    const result = messageCreatePayloadSchema.safeParse({
      peer: 'bob',
      body: 'hi',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing body and overflow_ref', () => {
    const result = messageCreatePayloadSchema.safeParse({ peer: 'bob' });
    expect(result.success).toBe(false);
  });
});
