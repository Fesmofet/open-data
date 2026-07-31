export function userProfilePath(username: string): string {
  return `/@${encodeURIComponent(username)}`;
}

export function postPath(author: string, permlink: string): string {
  return `/@${encodeURIComponent(author)}/${encodeURIComponent(permlink)}`;
}

export function objectPath(objectIdOrPermlink: string): string {
  return `/object/${encodeURIComponent(objectIdOrPermlink)}`;
}

export function objectUpdatePath(objectId: string, updateId: string): string {
  return `/object/${encodeURIComponent(objectId)}/updates/${encodeURIComponent(updateId)}`;
}

export function walletTransfersPath(
  username: string,
  type?: string,
): string {
  const base = `/@${encodeURIComponent(username)}/transfers`;
  if (!type) {
    return base;
  }
  return `${base}?type=${encodeURIComponent(type)}`;
}
