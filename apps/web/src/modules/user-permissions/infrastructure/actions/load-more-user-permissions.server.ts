'use server';

import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

import { USER_PERMISSIONS_PAGE_SIZE } from '../../constants';
import type {
  PaginatedUserPermissionsList,
  UserPermissionsAuthorityType,
  UserPermissionsSort,
  UserPermissionsTab,
} from '../../application/dto/user-permissions.dto';
import { getUserAuthorityGranteesPageQuery } from '../../application/queries/get-user-authority-grantees-page.query';
import { getUserAuthorityGrantorsPageQuery } from '../../application/queries/get-user-authority-grantors-page.query';

export async function loadMoreUserPermissionsAction(
  profileAccountName: string,
  tab: UserPermissionsTab,
  args: {
    type?: UserPermissionsAuthorityType;
    sort: UserPermissionsSort;
    skip: number;
  },
): Promise<PaginatedUserPermissionsList> {
  await createCookieAuthContextProvider().getUser();

  const query = {
    type: args.type,
    sort: args.sort,
    skip: args.skip,
    limit: USER_PERMISSIONS_PAGE_SIZE,
  };

  if (tab === 'received') {
    return getUserAuthorityGrantorsPageQuery(profileAccountName, query);
  }

  return getUserAuthorityGranteesPageQuery(profileAccountName, query);
}
