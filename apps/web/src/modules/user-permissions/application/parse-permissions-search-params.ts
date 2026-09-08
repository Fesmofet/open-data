import {
  USER_PERMISSIONS_AUTHORITY_TYPES,
  USER_PERMISSIONS_SORTS,
  USER_PERMISSIONS_TABS,
  type UserPermissionsAuthorityType,
  type UserPermissionsSort,
  type UserPermissionsTab,
} from './dto/user-permissions.dto';

function readSingle(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function parsePermissionsTabParam(
  raw: string | string[] | undefined,
): UserPermissionsTab {
  const value = readSingle(raw);
  return USER_PERMISSIONS_TABS.includes(value as UserPermissionsTab)
    ? (value as UserPermissionsTab)
    : 'granted';
}

export function parsePermissionsTypeParam(
  raw: string | string[] | undefined,
): UserPermissionsAuthorityType | undefined {
  const value = readSingle(raw);
  if (!value) {
    return undefined;
  }
  return USER_PERMISSIONS_AUTHORITY_TYPES.includes(value as UserPermissionsAuthorityType)
    ? (value as UserPermissionsAuthorityType)
    : undefined;
}

export function parsePermissionsSortParam(
  raw: string | string[] | undefined,
): UserPermissionsSort {
  const value = readSingle(raw);
  return USER_PERMISSIONS_SORTS.includes(value as UserPermissionsSort)
    ? (value as UserPermissionsSort)
    : 'a-z';
}
