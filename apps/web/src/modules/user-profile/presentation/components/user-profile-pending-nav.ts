import { getSegmentsAfterAccount } from './profile-path';

export type ProfileNavTarget = {
  pathname: string;
  search: string;
};

export const PENDING_NAV_TIMEOUT_MS = 10_000;

export function parseProfileNavHref(href: string): ProfileNavTarget {
  const q = href.indexOf('?');
  if (q === -1) {
    return { pathname: href, search: '' };
  }
  return { pathname: href.slice(0, q), search: href.slice(q + 1) };
}

export function getAccountFromPathname(pathname: string): string | null {
  if (pathname.startsWith('/@')) {
    const parts = pathname.slice(2).split('/').filter(Boolean);
    return parts[0] ?? null;
  }
  if (pathname.startsWith('/user-profile/')) {
    const parts = pathname.slice('/user-profile/'.length).split('/').filter(Boolean);
    return parts[0] ?? null;
  }
  return null;
}

export type NormalizedProfileNavTarget = {
  account: string;
  segments: string[];
  search: string;
};

export function normalizeProfileNavTarget(
  target: ProfileNavTarget,
): NormalizedProfileNavTarget {
  const account = getAccountFromPathname(target.pathname);
  if (!account) {
    return { account: '', segments: [], search: target.search };
  }
  return {
    account: account.toLowerCase(),
    segments: getSegmentsAfterAccount(target.pathname),
    search: target.search,
  };
}

/** Pending cleared once router URL matches the clicked href (normalized path + optional query). */
export function isPendingNavReached(
  pending: ProfileNavTarget,
  current: ProfileNavTarget,
): boolean {
  const p = normalizeProfileNavTarget(pending);
  const c = normalizeProfileNavTarget(current);
  if (!p.account || p.account !== c.account) {
    return false;
  }
  if (p.segments.join('/') !== c.segments.join('/')) {
    return false;
  }
  if (!pending.search) {
    return true;
  }
  return pending.search === current.search;
}
