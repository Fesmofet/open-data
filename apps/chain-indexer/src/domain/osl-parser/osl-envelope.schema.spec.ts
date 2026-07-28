import { oslEnvelopeSchema } from './osl-envelope.schema';

describe('oslEnvelopeSchema', () => {
  it('accepts hive_engine_deposit envelope', () => {
    const parsed = oslEnvelopeSchema.safeParse({
      events: [
        {
          action: 'hive_engine_deposit',
          v: 1,
          payload: {
            author: 'alice',
            destination: 'alice',
            symbol_in: 'HIVE',
            symbol_out: 'SWAP.HIVE',
            pair: 'HIVE -> SWAP.HIVE',
            ex_rate: 1,
            deposit_account: 'honey-swap',
            memo: '{"id":"ssc-mainnet-hive"}',
          },
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });
});
