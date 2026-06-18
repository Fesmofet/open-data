import { buildActivityRowView, buildActivityPageViews } from './build-activity-row-view';

describe('buildActivityRowView', () => {
  const ctx = {
    profileAccount: 'alice',
    chainContext: {
      totalVestingShares: '1000000',
      totalVestingFundSteem: '500000',
    },
  };

  it('maps vote operation', () => {
    const row = buildActivityRowView(
      {
        id: '1:1',
        operationIndex: 1,
        trxId: 'abc',
        timestamp: '2024-01-01T00:00:00Z',
        block: 1,
        type: 'vote',
        payload: {
          voter: 'alice',
          author: 'bob',
          permlink: 'post-1',
          weight: 10000,
        },
      },
      ctx,
    );
    expect(row?.kind).toBe('vote');
    if (row?.kind === 'vote') {
      expect(row.isProfileActor).toBe(true);
      expect(row.weight).toBe(10000);
    }
  });

  it('returns null for effective_comment_vote', () => {
    expect(
      buildActivityRowView(
        {
          id: '1:1',
          operationIndex: 1,
          trxId: 'abc',
          timestamp: '2024-01-01T00:00:00Z',
          block: 1,
          type: 'effective_comment_vote',
          payload: {},
        },
        ctx,
      ),
    ).toBeNull();
  });

  it('maps transfer direction for profile account', () => {
    const row = buildActivityRowView(
      {
        id: '1:2',
        operationIndex: 2,
        trxId: 'def',
        timestamp: '2024-01-01T00:00:01Z',
        block: 1,
        type: 'transfer',
        payload: {
          from: 'bob',
          to: 'alice',
          amount: '1.000 HIVE',
          memo: 'hi',
        },
      },
      ctx,
    );
    expect(row?.kind).toBe('wallet_transfer');
    if (row?.kind === 'wallet_transfer') {
      expect(row.direction).toBe('in');
      expect(row.counterparty).toBe('bob');
    }
  });

  it('maps limit_order with sell and min receive amounts', () => {
    const row = buildActivityRowView(
      {
        id: '1:3',
        operationIndex: 3,
        trxId: 'lim',
        timestamp: '2024-01-01T00:00:02Z',
        block: 1,
        type: 'limit_order',
        payload: {
          seller: 'alice',
          orderid: 1,
          amount_to_sell: '10.000 HIVE',
          min_to_receive: '2.000 HBD',
        },
      },
      ctx,
    );
    expect(row?.kind).toBe('wallet_limit_order');
    if (row?.kind === 'wallet_limit_order') {
      expect(row.amountToSell).toBe('10.000 HIVE');
      expect(row.minToReceive).toBe('2.000 HBD');
    }
  });

  it('maps comment as post when parent_author is empty', () => {
    const row = buildActivityRowView(
      {
        id: '1:4',
        operationIndex: 4,
        trxId: 'cmt',
        timestamp: '2024-01-01T00:00:03Z',
        block: 1,
        type: 'comment',
        payload: {
          author: 'alice',
          permlink: 'my-post',
          parent_author: '',
          parent_permlink: '',
        },
      },
      ctx,
    );
    expect(row?.kind).toBe('comment');
    if (row?.kind === 'comment') {
      expect(row.isPost).toBe(true);
      expect(row.isProfileActor).toBe(true);
    }
  });

  it('maps curation reward with HP from vests asset string', () => {
    const row = buildActivityRowView(
      {
        id: '1:5',
        operationIndex: 5,
        trxId: 'cur',
        timestamp: '2024-01-01T00:00:04Z',
        block: 1,
        type: 'curation_reward',
        payload: {
          author: 'bob',
          permlink: 'post-1',
          curator: 'alice',
          reward: '4.933654 VESTS',
        },
      },
      {
        profileAccount: 'alice',
        chainContext: {
          totalVestingShares: '341602453178.281332 VESTS',
          totalVestingFundSteem: '210616861.512 HIVE',
        },
      },
    );
    expect(row?.kind).toBe('reward_curation');
    if (row?.kind === 'reward_curation') {
      expect(row.author).toBe('bob');
      expect(row.permlink).toBe('post-1');
      expect(row.hpAmount).toBeCloseTo(0.00304, 4);
    }
  });

  it('filters null rows in buildActivityPageViews', () => {
    const rows = buildActivityPageViews(
      [
        {
          id: '1:1',
          operationIndex: 1,
          trxId: 'abc',
          timestamp: '2024-01-01T00:00:00Z',
          block: 1,
          type: 'effective_comment_vote',
          payload: {},
        },
        {
          id: '1:2',
          operationIndex: 2,
          trxId: 'def',
          timestamp: '2024-01-01T00:00:01Z',
          block: 1,
          type: 'transfer',
          payload: {
            from: 'bob',
            to: 'alice',
            amount: '1.000 HIVE',
            memo: '',
          },
        },
      ],
      ctx,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.kind).toBe('wallet_transfer');
  });
});
