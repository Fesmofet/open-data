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

  it('passes through already-wired ops', () => {
    const wired = [['custom_json', { id: 'odl-testnet' }]];
    expect(toHiveWireOperations(wired)).toEqual(wired);
  });
});
