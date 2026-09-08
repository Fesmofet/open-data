import type { HiveWireOperation } from './hive-operation-wire';

export type HiveAccountAuthEntry = readonly [string, number];

export type HiveAuthoritySnapshot = {
  weight_threshold: number;
  account_auths: HiveAccountAuthEntry[];
  key_auths: HiveAccountAuthEntry[];
};

export type MergeHiveAccountAuthsInput = {
  existing: readonly HiveAccountAuthEntry[];
  add?: string;
  remove?: string;
  weight?: number;
};

export type BuildAccountUpdateAuthorityOpInput = {
  account: string;
  authorityType: 'posting' | 'active';
  authority: HiveAuthoritySnapshot;
  memoKey: string;
  jsonMetadata: string;
};

export type BuildAccountUpdatePostingOpInput = {
  account: string;
  posting: HiveAuthoritySnapshot;
  memoKey: string;
  jsonMetadata: string;
};

function normalizeAccountNameAuthEntry(
  entry: readonly [unknown, unknown],
): HiveAccountAuthEntry {
  const name = String(entry[0]).trim().toLowerCase();
  const weight = Number(entry[1]);
  if (!name || !Number.isFinite(weight)) {
    throw new Error('Invalid account auth entry');
  }
  return [name, weight];
}

function normalizeKeyAuthEntry(
  entry: readonly [unknown, unknown],
): HiveAccountAuthEntry {
  const key = String(entry[0]).trim();
  const weight = Number(entry[1]);
  if (!key || !Number.isFinite(weight)) {
    throw new Error('Invalid key auth entry');
  }
  return [key, weight];
}

/** Hive consensus / tutorial `.sort()` — ASCII byte order, not localeCompare. */
function compareHiveAccountNames(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortAccountAuths(entries: HiveAccountAuthEntry[]): HiveAccountAuthEntry[] {
  return [...entries].sort(([a], [b]) => compareHiveAccountNames(a, b));
}

function wireAuthoritySnapshot(snapshot: HiveAuthoritySnapshot): Record<string, unknown> {
  return {
    weight_threshold: snapshot.weight_threshold,
    account_auths: snapshot.account_auths.map(([name, w]) => [name, w]),
    key_auths: snapshot.key_auths.map(([key, w]) => [key, w]),
  };
}

/** Stable Keychain-friendly field order: identity + metadata first, authority blob last. */
export function buildAccountUpdateWirePayload(input: {
  account: string;
  memoKey: string;
  jsonMetadata: string;
  posting?: HiveAuthoritySnapshot;
  active?: HiveAuthoritySnapshot;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    account: input.account.trim().toLowerCase(),
    memo_key: input.memoKey,
    json_metadata: input.jsonMetadata,
  };
  if (input.posting) {
    payload['posting'] = wireAuthoritySnapshot(input.posting);
  }
  if (input.active) {
    payload['active'] = wireAuthoritySnapshot(input.active);
  }
  return payload;
}

/**
 * Merge posting/active/owner account_auths: add or remove one grantee, sorted by name.
 */
export function mergeHiveAccountAuths(
  input: MergeHiveAccountAuthsInput,
): HiveAccountAuthEntry[] {
  const { add, remove, weight = 1 } = input;
  if (add && remove) {
    throw new Error('Provide at most one of add or remove');
  }
  if (!add && !remove) {
    throw new Error('Provide add or remove');
  }

  const normalizedAdd = add?.trim().toLowerCase();
  const normalizedRemove = remove?.trim().toLowerCase();
  const map = new Map<string, number>();

  for (const entry of input.existing) {
    const [name, entryWeight] = normalizeAccountNameAuthEntry(entry);
    map.set(name, entryWeight);
  }

  if (normalizedAdd) {
    map.set(normalizedAdd, weight);
  }
  if (normalizedRemove) {
    map.delete(normalizedRemove);
  }

  return sortAccountAuths([...map.entries()]);
}

export function normalizeHiveAuthoritySnapshot(
  authority: {
    weight_threshold?: number;
    account_auths?: readonly (readonly [unknown, unknown])[];
    key_auths?: readonly (readonly [unknown, unknown])[];
  },
): HiveAuthoritySnapshot {
  const keyAuths = (authority.key_auths ?? []).map(normalizeKeyAuthEntry);
  if (keyAuths.length === 0) {
    throw new Error('Authority must retain at least one key_auth');
  }

  const weightThreshold = authority.weight_threshold ?? 1;
  if (!Number.isFinite(weightThreshold)) {
    throw new Error('Authority weight_threshold must be a finite number');
  }

  return {
    weight_threshold: weightThreshold,
    account_auths: sortAccountAuths(
      (authority.account_auths ?? []).map(normalizeAccountNameAuthEntry),
    ),
    key_auths: keyAuths,
  };
}

function buildAccountUpdateWireOp(
  input: BuildAccountUpdateAuthorityOpInput,
): HiveWireOperation {
  const authority = normalizeHiveAuthoritySnapshot(input.authority);
  const payload = buildAccountUpdateWirePayload({
    account: input.account,
    memoKey: input.memoKey,
    jsonMetadata: input.jsonMetadata,
    ...(input.authorityType === 'posting'
      ? { posting: authority }
      : { active: authority }),
  });

  return ['account_update', payload];
}

/** Domain op for posting or active authority changes (active key required). */
export function buildAccountUpdateAuthorityOp(
  input: BuildAccountUpdateAuthorityOpInput,
): {
  type: 'account_update';
  account: string;
  posting?: HiveAuthoritySnapshot;
  active?: HiveAuthoritySnapshot;
  memo_key: string;
  json_metadata: string;
} {
  const account = input.account.trim().toLowerCase();
  const authority = normalizeHiveAuthoritySnapshot(input.authority);

  if (input.authorityType === 'posting') {
    return {
      type: 'account_update',
      account,
      memo_key: input.memoKey,
      json_metadata: input.jsonMetadata,
      posting: authority,
    };
  }

  return {
    type: 'account_update',
    account,
    memo_key: input.memoKey,
    json_metadata: input.jsonMetadata,
    active: authority,
  };
}

/** Build account_update wire tuple for posting authority changes (active key required). */
export function buildAccountUpdatePostingOp(
  input: BuildAccountUpdatePostingOpInput,
): HiveWireOperation {
  return buildAccountUpdateWireOp({
    account: input.account,
    authorityType: 'posting',
    authority: input.posting,
    memoKey: input.memoKey,
    jsonMetadata: input.jsonMetadata,
  });
}

/** Build account_update wire tuple for active authority changes (active key required). */
export function buildAccountUpdateActiveOp(
  input: Omit<BuildAccountUpdatePostingOpInput, 'posting'> & {
    active: HiveAuthoritySnapshot;
  },
): HiveWireOperation {
  return buildAccountUpdateWireOp({
    account: input.account,
    authorityType: 'active',
    authority: input.active,
    memoKey: input.memoKey,
    jsonMetadata: input.jsonMetadata,
  });
}
