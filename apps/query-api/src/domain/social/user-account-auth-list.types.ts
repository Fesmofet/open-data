import type { HiveAccountAuthorityType } from '@opden-data-layer/odl-db-types';

export type UserAccountAuthGrantorItem = {
  grantor: string;
  authorityType: HiveAccountAuthorityType;
  avatarUrl: string | null;
  wobjectsWeight: number;
  usersFollowingCount: number;
};

export type UserAccountAuthGranteeItem = {
  grantee: string;
  authorityType: HiveAccountAuthorityType;
  avatarUrl: string | null;
  wobjectsWeight: number;
  usersFollowingCount: number;
};

export type PaginatedUserAccountAuthGrantors = {
  items: UserAccountAuthGrantorItem[];
  total: number;
  hasMore: boolean;
};

export type PaginatedUserAccountAuthGrantees = {
  items: UserAccountAuthGranteeItem[];
  total: number;
  hasMore: boolean;
};
