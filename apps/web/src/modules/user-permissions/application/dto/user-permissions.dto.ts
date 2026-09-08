export const USER_PERMISSIONS_TABS = ['granted', 'received'] as const;
export type UserPermissionsTab = (typeof USER_PERMISSIONS_TABS)[number];

export const USER_PERMISSIONS_AUTHORITY_TYPES = ['owner', 'active', 'posting'] as const;
export type UserPermissionsAuthorityType = (typeof USER_PERMISSIONS_AUTHORITY_TYPES)[number];

/** Matches query-api authority list sort (`GET .../authority-grantors` & `grantees`). */
export const USER_PERMISSIONS_SORTS = ['rank', 'followers', 'a-z', 'recency'] as const;
export type UserPermissionsSort = (typeof USER_PERMISSIONS_SORTS)[number];

export type UserPermissionsAuthorityRow = {
  accountName: string;
  authorityType: UserPermissionsAuthorityType;
  avatarUrl: string | null;
  wobjectsWeight: number;
  usersFollowingCount: number;
};

export type PaginatedUserPermissionsList = {
  items: UserPermissionsAuthorityRow[];
  total: number;
  hasMore: boolean;
};

export type UserPermissionsListQuery = {
  type?: UserPermissionsAuthorityType;
  sort: UserPermissionsSort;
  skip: number;
  limit: number;
};

export type LoadMoreUserPermissionsFn = (
  profileAccountName: string,
  tab: UserPermissionsTab,
  args: {
    type?: UserPermissionsAuthorityType;
    sort: UserPermissionsSort;
    skip: number;
  },
) => Promise<PaginatedUserPermissionsList>;
