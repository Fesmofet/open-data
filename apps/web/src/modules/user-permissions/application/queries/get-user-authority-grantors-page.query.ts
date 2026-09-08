import 'server-only';

import { USER_PERMISSIONS_PAGE_SIZE } from '../../constants';
import type {
  PaginatedUserPermissionsList,
  UserPermissionsListQuery,
} from '../dto/user-permissions.dto';
import { fetchUserAuthorityGrantors } from '../../infrastructure/clients/user-permissions.client';

const EMPTY: PaginatedUserPermissionsList = {
  items: [],
  total: 0,
  hasMore: false,
};

export async function getUserAuthorityGrantorsPageQuery(
  accountName: string,
  query: UserPermissionsListQuery,
): Promise<PaginatedUserPermissionsList> {
  const page = await fetchUserAuthorityGrantors(accountName, {
    type: query.type,
    sort: query.sort,
    skip: query.skip,
    limit: query.limit ?? USER_PERMISSIONS_PAGE_SIZE,
  });
  return page ?? EMPTY;
}
