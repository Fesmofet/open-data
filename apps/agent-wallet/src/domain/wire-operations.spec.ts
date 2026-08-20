import { isCustomJsonOp, toHiveWireOperations } from './wire-operations';

describe('wire-operations', () => {
  it('detects custom_json ops', () => {
    expect(
      isCustomJsonOp({
        type: 'custom_json',
        json: '{"events":[]}',
        required_auths: [],
        required_posting_auths: ['alice'],
        id: 'odl-testnet',
      }),
    ).toBe(true);
    expect(isCustomJsonOp({ type: 'transfer' })).toBe(false);
  });

  it('converts custom_json ops to hive wire tuples', () => {
    const ops = toHiveWireOperations([
      {
        type: 'custom_json',
        json: '{"events":[]}',
        required_auths: [],
        required_posting_auths: ['alice'],
        id: 'odl-testnet',
      },
    ]);

    expect(ops).toEqual([
      [
        'custom_json',
        {
          required_auths: [],
          required_posting_auths: ['alice'],
          id: 'odl-testnet',
          json: '{"events":[]}',
        },
      ],
    ]);
  });

  it('converts delegate_vesting_shares to wire tuple', () => {
    const ops = toHiveWireOperations([
      {
        type: 'delegate_vesting_shares',
        delegator: 'alice',
        delegatee: 'bob',
        vesting_shares: '1.000000 VESTS',
      },
    ]);

    expect(ops).toEqual([
      [
        'delegate_vesting_shares',
        {
          delegator: 'alice',
          delegatee: 'bob',
          vesting_shares: '1.000000 VESTS',
        },
      ],
    ]);
  });

  it('passes through already-wired ops', () => {
    const wired = [['custom_json', { id: 'odl-testnet' }]];
    expect(toHiveWireOperations(wired)).toEqual(wired);
  });

  it('rejects unsupported operation shapes', () => {
    expect(() => toHiveWireOperations([{ foo: 'bar' }])).toThrow(
      'Unsupported operation shape for broadcast',
    );
  });
});
