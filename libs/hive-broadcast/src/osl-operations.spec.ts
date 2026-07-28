import { buildOslHiveEngineDepositOp } from './osl-operations';

describe('osl-operations', () => {
  it('buildOslHiveEngineDepositOp uses osl-mainnet and hive_engine_deposit', () => {
    const op = buildOslHiveEngineDepositOp({
      id: 'osl-mainnet',
      account: 'alice',
      payload: {
        author: 'alice',
        destination: 'alice',
        symbol_in: 'HIVE',
        symbol_out: 'SWAP.HIVE',
        pair: 'HIVE -> SWAP.HIVE',
        ex_rate: 1,
        deposit_account: 'honey-swap',
        memo: '{}',
      },
    });
    expect(op.id).toBe('osl-mainnet');
    expect(op.required_posting_auths).toEqual(['alice']);
    const parsed = JSON.parse(op.json) as {
      events: { action: string; v: number; payload: Record<string, unknown> }[];
    };
    expect(parsed.events[0]?.action).toBe('hive_engine_deposit');
    expect(parsed.events[0]?.v).toBe(1);
    expect(parsed.events[0]?.payload['symbol_in']).toBe('HIVE');
  });
});
