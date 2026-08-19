import {
  buildOslChannelLeaveOp,
  buildOslChannelMemberAddOp,
  buildOslChannelUpdateOp,
} from './osl-operations';

describe('channel leave/update operations', () => {
  it('buildOslChannelLeaveOp uses channel_leave action', () => {
    const op = buildOslChannelLeaveOp({
      id: 'osl-testnet',
      leaver: 'alice',
      payload: {
        channel_id: 'grp-1',
        delete_my_messages: true,
        successor_admin: 'bob',
      },
    });
    expect(op.id).toBe('osl-testnet');
    expect(op.required_posting_auths).toEqual(['alice']);
    const parsed = JSON.parse(op.json) as {
      events: { action: string; payload: Record<string, unknown> }[];
    };
    expect(parsed.events[0]?.action).toBe('channel_leave');
    expect(parsed.events[0]?.payload).toMatchObject({
      channel_id: 'grp-1',
      delete_my_messages: true,
      successor_admin: 'bob',
    });
  });

  it('buildOslChannelUpdateOp uses channel_update action', () => {
    const op = buildOslChannelUpdateOp({
      id: 'osl-testnet',
      admin: 'alice',
      payload: {
        channel_id: 'grp-1',
        title: 'Renamed',
        image: { cid: 'QmTest' },
      },
    });
    expect(op.id).toBe('osl-testnet');
    expect(op.required_posting_auths).toEqual(['alice']);
    const parsed = JSON.parse(op.json) as {
      events: { action: string; payload: Record<string, unknown> }[];
    };
    expect(parsed.events[0]?.action).toBe('channel_update');
    expect(parsed.events[0]?.payload).toMatchObject({
      channel_id: 'grp-1',
      title: 'Renamed',
      image: { cid: 'QmTest' },
    });
  });

  it('buildOslChannelMemberAddOp uses channel_member_add action', () => {
    const op = buildOslChannelMemberAddOp({
      id: 'osl-testnet',
      admin: 'alice',
      payload: { channel_id: 'grp-1', account: 'bob' },
    });
    expect(op.id).toBe('osl-testnet');
    expect(op.required_posting_auths).toEqual(['alice']);
    const parsed = JSON.parse(op.json) as {
      events: { action: string; payload: Record<string, unknown> }[];
    };
    expect(parsed.events[0]?.action).toBe('channel_member_add');
    expect(parsed.events[0]?.payload).toMatchObject({
      channel_id: 'grp-1',
      account: 'bob',
    });
  });
});
