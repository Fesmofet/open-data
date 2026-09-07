import { z } from 'zod';
import type { HiveAccountAuthorityType } from '@opden-data-layer/odl-db-types';

export const HIVE_ACCOUNT_AUTHORITY_TYPES = [
  'owner',
  'active',
  'posting',
] as const satisfies readonly HiveAccountAuthorityType[];

const hiveAuthoritySchema = z
  .object({
    account_auths: z.array(z.unknown()).optional(),
    key_auths: z.array(z.unknown()).optional(),
    weight_threshold: z.number().optional(),
  })
  .passthrough();

const authorityFieldSchema = hiveAuthoritySchema.optional();

export const accountAuthorityUpdateSchema = z.object({
  account: z.string().min(1).optional(),
  owner: authorityFieldSchema,
  active: authorityFieldSchema,
  posting: authorityFieldSchema,
});

export const accountAuthorityCreateSchema = z.object({
  new_account_name: z.string().min(1).optional(),
  owner: authorityFieldSchema,
  active: authorityFieldSchema,
  posting: authorityFieldSchema,
});

export const accountAuthorityRecoverSchema = z.object({
  account_to_recover: z.string().min(1).optional(),
  new_owner_authority: authorityFieldSchema,
});

export type ParsedAccountAuthorityUpdate = {
  grantor: string;
  types: Partial<Record<HiveAccountAuthorityType, string[]>>;
};

function granteesFromAuthority(
  authority: z.infer<typeof hiveAuthoritySchema> | undefined,
): string[] | undefined {
  if (authority === undefined) {
    return undefined;
  }
  const names: string[] = [];
  const seen = new Set<string>();
  for (const entry of authority.account_auths ?? []) {
    if (!Array.isArray(entry) || entry.length < 1) {
      continue;
    }
    const name = typeof entry[0] === 'string' ? entry[0].trim() : '';
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    names.push(name);
  }
  return names;
}

function parseAuthorityTypes(
  grantor: string,
  payload: z.infer<typeof accountAuthorityUpdateSchema>,
): ParsedAccountAuthorityUpdate | null {
  const types: Partial<Record<HiveAccountAuthorityType, string[]>> = {};
  for (const type of HIVE_ACCOUNT_AUTHORITY_TYPES) {
    const grantees = granteesFromAuthority(payload[type]);
    if (grantees !== undefined) {
      types[type] = grantees;
    }
  }
  if (Object.keys(types).length === 0) {
    return null;
  }
  return { grantor, types };
}

export function parseAccountAuthorityUpdate(
  payload: Record<string, unknown>,
): ParsedAccountAuthorityUpdate | null {
  const parsed = accountAuthorityUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return null;
  }
  const grantor = parsed.data.account?.trim();
  if (!grantor) {
    return null;
  }
  return parseAuthorityTypes(grantor, parsed.data);
}

export function parseAccountAuthorityCreate(
  payload: Record<string, unknown>,
): ParsedAccountAuthorityUpdate | null {
  const parsed = accountAuthorityCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return null;
  }
  const grantor = parsed.data.new_account_name?.trim();
  if (!grantor) {
    return null;
  }
  return parseAuthorityTypes(grantor, parsed.data);
}

export function parseAccountAuthorityRecover(
  payload: Record<string, unknown>,
): ParsedAccountAuthorityUpdate | null {
  const parsed = accountAuthorityRecoverSchema.safeParse(payload);
  if (!parsed.success) {
    return null;
  }
  const grantor = parsed.data.account_to_recover?.trim();
  if (!grantor) {
    return null;
  }
  const owner = granteesFromAuthority(parsed.data.new_owner_authority);
  if (owner === undefined) {
    return null;
  }
  return { grantor, types: { owner } };
}

export function parseAccountAuthorityFromHiveAccount(account: {
  name: string;
  owner?: { account_auths?: [string, number][] };
  active?: { account_auths?: [string, number][] };
  posting?: { account_auths?: [string, number][] };
}): ParsedAccountAuthorityUpdate {
  const types: Partial<Record<HiveAccountAuthorityType, string[]>> = {};
  for (const type of HIVE_ACCOUNT_AUTHORITY_TYPES) {
    types[type] = granteesFromAuthority(account[type]) ?? [];
  }
  return { grantor: account.name.trim(), types };
}
