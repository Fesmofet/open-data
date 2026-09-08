'use server';

import {
  buildAccountUpdateAuthorityOp,
  mergeHiveAccountAuths,
  normalizeHiveAuthoritySnapshot,
} from '@opden-data-layer/hive-broadcast';
import type { AccountUpdateOp } from '@opden-data-layer/hive-broadcast';

import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';
import { hiveRpcRequest } from '@/shared/infrastructure/hive/hive-rpc.server';

import {
  isValidHiveAccountName,
  normalizeHiveAccountName,
} from '../../domain/hive-account-name';

type HiveAccountRpc = {
  name: string;
  memo_key: string;
  json_metadata: string;
  posting: {
    weight_threshold?: number;
    account_auths?: [string, number][];
    key_auths?: [string, number][];
  };
  active: {
    weight_threshold?: number;
    account_auths?: [string, number][];
    key_auths?: [string, number][];
  };
};

export type BuildAuthorityUpdateOpResult =
  | { ok: true; operation: AccountUpdateOp }
  | { ok: false; error: string };

function serializeJsonMetadata(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value == null) {
    return '';
  }
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

async function buildAuthorityUpdateOp(input: {
  grantor: string;
  grantee: string;
  authorityType: 'posting' | 'active';
  weight: number;
  mode: 'add' | 'remove';
}): Promise<BuildAuthorityUpdateOpResult> {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const viewer = user?.username?.trim().toLowerCase();
  const grantor = normalizeHiveAccountName(input.grantor);
  const grantee = normalizeHiveAccountName(input.grantee);

  if (!viewer || viewer !== grantor) {
    return { ok: false, error: 'not_authorized' };
  }
  if (!isValidHiveAccountName(grantee)) {
    return { ok: false, error: 'invalid_grantee' };
  }
  if (grantee === grantor) {
    return { ok: false, error: 'self_grant' };
  }
  if (!Number.isFinite(input.weight) || input.weight < 1) {
    return { ok: false, error: 'invalid_weight' };
  }

  const accounts = await hiveRpcRequest<HiveAccountRpc[]>('condenser_api.get_accounts', [
    [grantor],
  ]);
  const account = accounts?.[0];
  if (!account) {
    return { ok: false, error: 'account_not_found' };
  }

  const authorityRaw =
    input.authorityType === 'posting' ? account.posting : account.active;
  const existingAuths = authorityRaw?.account_auths ?? [];
  const mergedAuths = mergeHiveAccountAuths({
    existing: existingAuths,
    add: input.mode === 'add' ? grantee : undefined,
    remove: input.mode === 'remove' ? grantee : undefined,
    weight: input.weight,
  });

  const authority = normalizeHiveAuthoritySnapshot({
    weight_threshold: authorityRaw?.weight_threshold,
    account_auths: mergedAuths,
    key_auths: authorityRaw?.key_auths ?? [],
  });

  const operation = buildAccountUpdateAuthorityOp({
    account: grantor,
    authorityType: input.authorityType,
    authority,
    memoKey: account.memo_key,
    jsonMetadata: serializeJsonMetadata(account.json_metadata),
  });

  return { ok: true, operation };
}

export async function buildGrantAuthorityOpAction(input: {
  grantor: string;
  grantee: string;
  authorityType: 'posting' | 'active';
  weight?: number;
}): Promise<BuildAuthorityUpdateOpResult> {
  return buildAuthorityUpdateOp({
    grantor: input.grantor,
    grantee: input.grantee,
    authorityType: input.authorityType,
    weight: input.weight ?? 1,
    mode: 'add',
  });
}

export async function buildRevokeAuthorityOpAction(input: {
  grantor: string;
  grantee: string;
  authorityType: 'posting' | 'active';
}): Promise<BuildAuthorityUpdateOpResult> {
  return buildAuthorityUpdateOp({
    grantor: input.grantor,
    grantee: input.grantee,
    authorityType: input.authorityType,
    weight: 1,
    mode: 'remove',
  });
}
