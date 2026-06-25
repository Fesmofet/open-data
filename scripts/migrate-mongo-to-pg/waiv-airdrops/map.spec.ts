import { mongoWaivAirdropToRow, WAIV_AIRDROP_OPERATION } from './map';

describe('mongoWaivAirdropToRow', () => {
  const validDoc = {
    account: 'dp7',
    transactionId: '000c37195fffc51a72f34c3221279eb21e66f746',
    blockNumber: 11087820,
    refHiveBlockNumber: 58072887,
    timestamp: 1633597380,
    quantity: '10',
    tokenState: 'stake',
    symbol: 'WAIV',
    operation: WAIV_AIRDROP_OPERATION,
  };

  it('maps legacy WAIV airdrop document', () => {
    expect(mongoWaivAirdropToRow(validDoc)).toEqual({
      account: 'dp7',
      transaction_id: '000c37195fffc51a72f34c3221279eb21e66f746',
      block_number: 11087820,
      ref_hive_block_number: 58072887,
      block_timestamp: new Date(1633597380 * 1000),
      quantity: '10',
      token_state: 'stake',
    });
  });

  it('skips non-WAIV symbol', () => {
    expect(mongoWaivAirdropToRow({ ...validDoc, symbol: 'BEE' })).toBeNull();
  });

  it('skips wrong operation', () => {
    expect(
      mongoWaivAirdropToRow({ ...validDoc, operation: 'marketpools_swapTokens' }),
    ).toBeNull();
  });

  it('skips missing tokenState', () => {
    expect(mongoWaivAirdropToRow({ ...validDoc, tokenState: '' })).toBeNull();
  });

  it('skips missing quantity', () => {
    expect(mongoWaivAirdropToRow({ ...validDoc, quantity: '' })).toBeNull();
  });

  it('accepts document without operation when symbol is WAIV', () => {
    const { operation: _op, ...withoutOp } = validDoc;
    expect(mongoWaivAirdropToRow(withoutOp)).not.toBeNull();
  });
});
