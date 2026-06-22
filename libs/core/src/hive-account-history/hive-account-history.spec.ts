import {
  classifyActivityOperation,
  parseCustomJsonOp,
  vestToHp,
  HIVE_OP,
} from './index';

describe('vestToHp', () => {
  it('converts vests to HP using global properties', () => {
    expect(vestToHp('1000000', '10000000', '5000000')).toBeCloseTo(500000);
  });

  it('parses Hive asset strings', () => {
    expect(
      vestToHp(
        '4.933654 VESTS',
        '341602453178.281332 VESTS',
        '210616861.512 HIVE',
      ),
    ).toBeCloseTo(0.00304, 4);
  });

  it('parses database_api asset objects', () => {
    expect(
      vestToHp(
        { amount: '4933654', precision: 6 },
        '341602453178.281332 VESTS',
        '210616861.512 HIVE',
      ),
    ).toBeCloseTo(0.00304, 4);
  });

  it('returns 0 for invalid input', () => {
    expect(vestToHp('x', '0', '1')).toBe(0);
  });
});

describe('parseCustomJsonOp', () => {
  it('parses reblog custom_json', () => {
    const json = JSON.stringify([
      'reblog',
      { author: 'bob', permlink: 'p1', account: 'alice' },
    ]);
    expect(parseCustomJsonOp('follow', json)).toEqual({
      kind: 'reblog',
      author: 'bob',
      permlink: 'p1',
      account: 'alice',
    });
  });

  it('parses follow custom_json', () => {
    const json = JSON.stringify([
      'follow',
      { follower: 'alice', following: 'bob', what: ['blog'] },
    ]);
    expect(parseCustomJsonOp('follow', json)).toEqual({
      kind: 'follow',
      follower: 'alice',
      following: 'bob',
      what: 'blog',
    });
  });
});

describe('classifyActivityOperation', () => {
  it('hides effective_comment_vote', () => {
    expect(classifyActivityOperation(HIVE_OP.EFFECTIVE_COMMENT_VOTE, {})).toBe('hidden');
  });

  it('classifies vote', () => {
    expect(classifyActivityOperation(HIVE_OP.VOTE, {})).toBe('vote');
  });

  it('classifies transfer as wallet', () => {
    expect(classifyActivityOperation(HIVE_OP.TRANSFER, {})).toBe('wallet_transfer');
  });

  it('classifies fill_order and limit_order separately', () => {
    expect(classifyActivityOperation(HIVE_OP.FILL_ORDER, {})).toBe('wallet_fill_order');
    expect(classifyActivityOperation(HIVE_OP.LIMIT_ORDER, {})).toBe('wallet_limit_order');
    expect(classifyActivityOperation(HIVE_OP.LIMIT_ORDER_CREATE2, {})).toBe(
      'wallet_limit_order',
    );
  });

  it('classifies limit_order_cancel and proposal_pay as wallet kinds', () => {
    expect(classifyActivityOperation(HIVE_OP.LIMIT_ORDER_CANCEL, {})).toBe(
      'wallet_cancel_order',
    );
    expect(classifyActivityOperation(HIVE_OP.PROPOSAL_PAY, {})).toBe('wallet_proposal_pay');
  });
});
