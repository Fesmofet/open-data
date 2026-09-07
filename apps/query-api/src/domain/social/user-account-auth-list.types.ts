import type { HiveAccountAuthorityType } from '@opden-data-layer/odl-db-types';

export type UserAccountAuthGrantorItem = {
  grantor: string;
  authorityType: HiveAccountAuthorityType;
};

export type UserAccountAuthGranteeItem = {
  grantee: string;
  authorityType: HiveAccountAuthorityType;
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
