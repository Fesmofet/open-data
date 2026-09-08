import {
  buildAccountUpdateActiveOp,
  buildAccountUpdateAuthorityOp,
  buildAccountUpdatePostingOp,
  mergeHiveAccountAuths,
  normalizeHiveAuthoritySnapshot,
} from './hive-account-authority-operations';

describe('hive-account-authority-operations', () => {
  const existingAuths: [string, number][] = [
    ['ecency.app', 1],
    ['hive.blog', 1],
    ['waivio.app', 1],
  ];

  it('adds grantee and sorts account_auths alphabetically', () => {
    expect(
      mergeHiveAccountAuths({
        existing: existingAuths,
        add: 'waivio.import',
      }),
    ).toEqual([
      ['ecency.app', 1],
      ['hive.blog', 1],
      ['waivio.app', 1],
      ['waivio.import', 1],
    ]);
  });

  it('is idempotent when grantee already present', () => {
    expect(
      mergeHiveAccountAuths({
        existing: existingAuths,
        add: 'waivio.app',
      }),
    ).toEqual(existingAuths);
  });

  it('sorts hyphen before dot (ASCII, matching Hive .sort())', () => {
    expect(
      mergeHiveAccountAuths({
        existing: [['waivio.app', 1]],
        add: 'waivio-app',
      }),
    ).toEqual([
      ['waivio-app', 1],
      ['waivio.app', 1],
    ]);
  });

  it('refuses non-finite weight_threshold', () => {
    expect(() =>
      normalizeHiveAuthoritySnapshot({
        weight_threshold: Number.NaN,
        account_auths: [],
        key_auths: [['STM1', 1]],
      }),
    ).toThrow('weight_threshold');
  });

  it('removes grantee and keeps sorted order', () => {
    expect(
      mergeHiveAccountAuths({
        existing: [
          ['ecency.app', 1],
          ['hive.blog', 1],
          ['waivio.app', 1],
          ['waivio.import', 1],
        ],
        remove: 'hive.blog',
      }),
    ).toEqual([
      ['ecency.app', 1],
      ['waivio.app', 1],
      ['waivio.import', 1],
    ]);
  });

  it('refuses empty key_auths in authority snapshot', () => {
    expect(() =>
      normalizeHiveAuthoritySnapshot({
        weight_threshold: 1,
        account_auths: [],
        key_auths: [],
      }),
    ).toThrow('Authority must retain at least one key_auth');
  });

  it('builds account_update wire tuple with posting, memo_key, json_metadata', () => {
    const op = buildAccountUpdatePostingOp({
      account: 'flowmaster',
      posting: {
        weight_threshold: 1,
        account_auths: [
          ['ecency.app', 1],
          ['waivio.import', 1],
        ],
        key_auths: [['STM5CSuEihKVibpeJ9ruxhQyzfYiDX1FrMh4fuDR2M2hbwTGqX9oA', 1]],
      },
      memoKey: 'STM6HhfiYyrZhLwM7AGCJgR2PbnUxmmednYZ2Vt4AgDExVGFwveLB',
      jsonMetadata: '{"beneficiaries":[]}',
    });

    expect(op[0]).toBe('account_update');
    expect(op[1]).toEqual({
      account: 'flowmaster',
      memo_key: 'STM6HhfiYyrZhLwM7AGCJgR2PbnUxmmednYZ2Vt4AgDExVGFwveLB',
      json_metadata: '{"beneficiaries":[]}',
      posting: {
        weight_threshold: 1,
        account_auths: [
          ['ecency.app', 1],
          ['waivio.import', 1],
        ],
        key_auths: [['STM5CSuEihKVibpeJ9ruxhQyzfYiDX1FrMh4fuDR2M2hbwTGqX9oA', 1]],
      },
    });
  });

  it('builds active account_update wire tuple', () => {
    const op = buildAccountUpdateActiveOp({
      account: 'flowmaster',
      active: {
        weight_threshold: 1,
        account_auths: [['waivio.import', 1]],
        key_auths: [['STM5CSuEihKVibpeJ9ruxhQyzfYiDX1FrMh4fuDR2M2hbwTGqX9oA', 1]],
      },
      memoKey: 'STM6HhfiYyrZhLwM7AGCJgR2PbnUxmmednYZ2Vt4AgDExVGFwveLB',
      jsonMetadata: '{}',
    });

    expect(op[0]).toBe('account_update');
    expect(op[1]).toMatchObject({
      account: 'flowmaster',
      active: {
        weight_threshold: 1,
        account_auths: [['waivio.import', 1]],
      },
    });
  });

  it('builds domain account_update op for posting authority', () => {
    const op = buildAccountUpdateAuthorityOp({
      account: 'flowmaster',
      authorityType: 'posting',
      authority: {
        weight_threshold: 1,
        account_auths: [['waivio.import', 1]],
        key_auths: [['STM5CSuEihKVibpeJ9ruxhQyzfYiDX1FrMh4fuDR2M2hbwTGqX9oA', 1]],
      },
      memoKey: 'STM6HhfiYyrZhLwM7AGCJgR2PbnUxmmednYZ2Vt4AgDExVGFwveLB',
      jsonMetadata: '{}',
    });

    expect(op.type).toBe('account_update');
    expect(op.posting?.account_auths).toEqual([['waivio.import', 1]]);
    expect(op.active).toBeUndefined();
  });
});
