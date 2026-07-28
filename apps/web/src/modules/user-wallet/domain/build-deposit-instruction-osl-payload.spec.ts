import { buildDepositInstructionOslPayload } from './build-deposit-instruction-osl-payload';

describe('buildDepositInstructionOslPayload', () => {
  it('builds account routing payload', () => {
    expect(
      buildDepositInstructionOslPayload({
        account: 'alice',
        destination: 'alice',
        symbolIn: 'HIVE',
        symbolOut: 'SWAP.HIVE',
        pair: 'HIVE/SWAP.HIVE',
        exRate: 1.01,
        memo: 'm',
        depositAccount: 'honey-swap',
        address: null,
      }),
    ).toEqual({
      author: 'alice',
      destination: 'alice',
      symbol_in: 'HIVE',
      symbol_out: 'SWAP.HIVE',
      pair: 'HIVE/SWAP.HIVE',
      ex_rate: 1.01,
      memo: 'm',
      deposit_account: 'honey-swap',
    });
  });

  it('rejects missing routing target', () => {
    expect(() =>
      buildDepositInstructionOslPayload({
        account: 'alice',
        destination: 'alice',
        symbolIn: 'BTC',
        symbolOut: 'SWAP.BTC',
        pair: 'BTC/SWAP.BTC',
        exRate: 1,
        memo: null,
        depositAccount: null,
        address: null,
      }),
    ).toThrow(/deposit account or address/);
  });
});
