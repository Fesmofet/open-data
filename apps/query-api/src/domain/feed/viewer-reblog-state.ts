export function viewerHasReblogged(
  rebloggedUsers: string[],
  viewerAccount: string | undefined,
  rebloggedInDb: boolean,
): boolean {
  if (rebloggedInDb) {
    return true;
  }
  const viewer = viewerAccount?.trim() ?? '';
  if (viewer === '') {
    return false;
  }
  const normalized = viewer.toLowerCase();
  return rebloggedUsers.some((u) => u.trim().toLowerCase() === normalized);
}
