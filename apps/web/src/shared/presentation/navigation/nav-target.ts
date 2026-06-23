export type NavTarget = {
  pathname: string;
  search: string;
};

export const PENDING_NAV_TIMEOUT_MS = 10_000;

export function parseNavHref(href: string): NavTarget {
  const q = href.indexOf('?');
  if (q === -1) {
    return { pathname: href, search: '' };
  }
  return { pathname: href.slice(0, q), search: href.slice(q + 1) };
}

/** Default pending cleared when pathname matches and search matches (if pending had search). */
export function isNavTargetReached(pending: NavTarget, current: NavTarget): boolean {
  if (pending.pathname !== current.pathname) {
    return false;
  }
  if (!pending.search) {
    return true;
  }
  return pending.search === current.search;
}
