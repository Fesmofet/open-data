import 'server-only';

import { queryApiFetch } from '@/modules/user-profile/infrastructure/clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

import type {
  PaginatedUserPermissionsList,
  UserPermissionsAuthorityType,
  UserPermissionsSort,
} from '../../application/dto/user-permissions.dto';

type AuthorityAccountApiFields = {
  avatarUrl: string | null;
  wobjectsWeight: number;
  usersFollowingCount: number;
};

type GrantorsApiResponse = {
  items: ({ grantor: string; authorityType: UserPermissionsAuthorityType } & AuthorityAccountApiFields)[];
  total: number;
  hasMore: boolean;
};

type GranteesApiResponse = {
  items: ({ grantee: string; authorityType: UserPermissionsAuthorityType } & AuthorityAccountApiFields)[];
  total: number;
  hasMore: boolean;
};

function buildQuery(params: Record<string, string | number | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) {
      continue;
    }
    u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : '';
}

function mapAuthorityProfileFields(row: Partial<AuthorityAccountApiFields>): AuthorityAccountApiFields {
  return {
    avatarUrl: row.avatarUrl ?? null,
    wobjectsWeight: row.wobjectsWeight ?? 0,
    usersFollowingCount: row.usersFollowingCount ?? 0,
  };
}

function mapGrantorsResponse(data: GrantorsApiResponse): PaginatedUserPermissionsList {
  return {
    items: data.items.map((row) => ({
      accountName: row.grantor,
      authorityType: row.authorityType,
      ...mapAuthorityProfileFields(row),
    })),
    total: data.total,
    hasMore: data.hasMore,
  };
}

function mapGranteesResponse(data: GranteesApiResponse): PaginatedUserPermissionsList {
  return {
    items: data.items.map((row) => ({
      accountName: row.grantee,
      authorityType: row.authorityType,
      ...mapAuthorityProfileFields(row),
    })),
    total: data.total,
    hasMore: data.hasMore,
  };
}

export async function fetchUserAuthorityGrantors(
  accountName: string,
  args: {
    type?: UserPermissionsAuthorityType;
    sort: UserPermissionsSort;
    skip?: number;
    limit: number;
  },
): Promise<PaginatedUserPermissionsList | null> {
  const qs = buildQuery({
    type: args.type,
    sort: args.sort,
    skip: args.skip ?? 0,
    limit: args.limit,
  });
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/authority-grantors${qs}`;
  const data = await queryApiFetch<GrantorsApiResponse>(path, {
    cacheTags: [queryApiCacheTags.userAuthorityGrantors(accountName)],
  });
  return data ? mapGrantorsResponse(data) : null;
}

export async function fetchUserAuthorityGrantees(
  accountName: string,
  args: {
    type?: UserPermissionsAuthorityType;
    sort: UserPermissionsSort;
    skip?: number;
    limit: number;
  },
): Promise<PaginatedUserPermissionsList | null> {
  const qs = buildQuery({
    type: args.type,
    sort: args.sort,
    skip: args.skip ?? 0,
    limit: args.limit,
  });
  const path = `/query/v1/users/${encodeURIComponent(accountName)}/authority-grantees${qs}`;
  const data = await queryApiFetch<GranteesApiResponse>(path, {
    cacheTags: [queryApiCacheTags.userAuthorityGrantees(accountName)],
  });
  return data ? mapGranteesResponse(data) : null;
}
