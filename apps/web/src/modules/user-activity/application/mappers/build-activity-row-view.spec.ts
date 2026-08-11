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

  it('maps self transfer when from and to are profile account', () => {
    const row = buildActivityRowView(
      {
        id: '1:6',
        operationIndex: 6,
        trxId: 'self',
        timestamp: '2024-01-01T00:00:05Z',
        block: 1,
        type: 'transfer',
        payload: {
          from: 'alice',
          to: 'alice',
          amount: '2.000 HIVE',
          memo: '',
        },
      },
      ctx,
    );
    expect(row?.kind).toBe('wallet_transfer');
    if (row?.kind === 'wallet_transfer') {
      expect(row.direction).toBe('self');
      expect(row.counterparty).toBe('alice');
    }
  });

  it('maps fill_order isSeller when profile is current_owner', () => {
    const row = buildActivityRowView(
      {
        id: '1:7',
        operationIndex: 7,
        trxId: 'fill',
        timestamp: '2024-01-01T00:00:06Z',
        block: 1,
        type: 'fill_order',
        payload: {
          current_owner: 'alice',
          open_owner: 'bob',
          current_pays: '10.000 HIVE',
          open_pays: '2.000 HBD',
        },
      },
      ctx,
    );
    expect(row?.kind).toBe('wallet_fill_order');
    if (row?.kind === 'wallet_fill_order') {
      expect(row.isSeller).toBe(true);
      expect(row.exchanger).toBe('bob');
    }
  });

  it('maps fill_order buyer when profile is open_owner', () => {
    const row = buildActivityRowView(
      {
        id: '1:8',
        operationIndex: 8,
        trxId: 'fill2',
        timestamp: '2024-01-01T00:00:07Z',
        block: 1,
        type: 'fill_order',
        payload: {
          current_owner: 'bob',
          open_owner: 'alice',
          current_pays: '10.000 HIVE',
          open_pays: '2.000 HBD',
        },
      },
      ctx,
    );
    expect(row?.kind).toBe('wallet_fill_order');
    if (row?.kind === 'wallet_fill_order') {
      expect(row.isSeller).toBe(false);
      expect(row.exchanger).toBe('bob');
    }
  });

  it('maps limit_order_create2 like limit_order', () => {
    const row = buildActivityRowView(
      {
        id: '1:9',
        operationIndex: 9,
        trxId: 'lim2',
        timestamp: '2024-01-01T00:00:08Z',
        block: 1,
        type: 'limit_order_create2',
        payload: {
          seller: 'alice',
          orderid: 2,
          amount_to_sell: '5.000 HBD',
          min_to_receive: '20.000 HIVE',
        },
      },
      ctx,
    );
    expect(row?.kind).toBe('wallet_limit_order');
    if (row?.kind === 'wallet_limit_order') {
      expect(row.amountToSell).toBe('5.000 HBD');
      expect(row.minToReceive).toBe('20.000 HIVE');
    }
  });

  it('maps wallet_savings with request_id', () => {
    const row = buildActivityRowView(
      {
        id: '1:10',
        operationIndex: 10,
        trxId: 'sav',
        timestamp: '2024-01-01T00:00:09Z',
        block: 1,
        type: 'transfer_from_savings',
        payload: {
          amount: '1.000 HIVE',
          request_id: 42,
        },
      },
      ctx,
    );
    expect(row?.kind).toBe('wallet_savings');
    if (row?.kind === 'wallet_savings') {
      expect(row.requestId).toBe('42');
    }
  });

  it('maps wallet_cancel_order', () => {
    const row = buildActivityRowView(
      {
        id: '1:11',
        operationIndex: 11,
        trxId: 'cancel',
        timestamp: '2024-01-01T00:00:10Z',
        block: 1,
        type: 'limit_order_cancel',
        payload: {
          open_pays: '10.000 HIVE',
          current_pays: '2.000 HBD',
        },
      },
      ctx,
    );
    expect(row?.kind).toBe('wallet_cancel_order');
    if (row?.kind === 'wallet_cancel_order') {
      expect(row.openPays).toBe('10.000 HIVE');
    }
  });

  it('maps wallet_proposal_pay direction', () => {
    const row = buildActivityRowView(
      {
        id: '1:12',
        operationIndex: 12,
        trxId: 'prop',
        timestamp: '2024-01-01T00:00:11Z',
        block: 1,
        type: 'proposal_pay',
        payload: {
          receiver: 'alice',
          hbd_payout: '1.000 HBD',
        },
      },
      ctx,
    );
    expect(row?.kind).toBe('wallet_proposal_pay');
    if (row?.kind === 'wallet_proposal_pay') {
      expect(row.direction).toBe('in');
      expect(row.amount).toBe('1.000 HBD');
    }
  });

  it('maps routed fill_vesting_withdraw as deposit for recipient', () => {
    const row = buildActivityRowView(
      {
        id: '1:13',
        operationIndex: 13,
        trxId: 'pd1',
        timestamp: '2024-01-01T00:00:12Z',
        block: 1,
        type: 'fill_vesting_withdraw',
        payload: {
          from_account: 'vancouverdining',
          to_account: 'waivio',
          deposited: '146.237 HIVE',
        },
      },
      { ...ctx, profileAccount: 'waivio' },
    );
    expect(row?.kind).toBe('wallet_power_down');
    if (row?.kind === 'wallet_power_down') {
      expect(row.subtype).toBe('withdraw');
      expect(row.direction).toBe('in');
      expect(row.counterparty).toBe('vancouverdining');
      expect(row.hpAmount).toBe('146.237 HP');
    }
  });

  it('maps routed fill_vesting_withdraw as withdrawal for source', () => {
    const row = buildActivityRowView(
      {
        id: '1:14',
        operationIndex: 14,
        trxId: 'pd2',
        timestamp: '2024-01-01T00:00:13Z',
        block: 1,
        type: 'fill_vesting_withdraw',
        payload: {
          from_account: 'vancouverdining',
          to_account: 'waivio',
          deposited: '146.237 HIVE',
        },
      },
      { ...ctx, profileAccount: 'vancouverdining' },
    );
    expect(row?.kind).toBe('wallet_power_down');
    if (row?.kind === 'wallet_power_down') {
      expect(row.subtype).toBe('withdraw');
      expect(row.direction).toBe('out');
      expect(row.counterparty).toBe('waivio');
      expect(row.hpAmount).toBe('146.237 HP');
    }
  });

  it('maps self fill_vesting_withdraw without counterparty', () => {
    const row = buildActivityRowView(
      {
        id: '1:15',
        operationIndex: 15,
        trxId: 'pd3',
        timestamp: '2024-01-01T00:00:14Z',
        block: 1,
        type: 'fill_vesting_withdraw',
        payload: {
          from_account: 'alice',
          to_account: 'alice',
          deposited: '1.000 HIVE',
        },
      },
      ctx,
    );
    expect(row?.kind).toBe('wallet_power_down');
    if (row?.kind === 'wallet_power_down') {
      expect(row.subtype).toBe('withdraw');
      expect(row.direction).toBe('in');
      expect(row.counterparty).toBe('');
      expect(row.hpAmount).toBe('1.000 HP');
    }
  });
});
