'use client';

import Link from 'next/link';
import { useLinkStatus } from 'next/link';
import { useEffect, useMemo, type ComponentProps, type ReactNode } from 'react';

import { usePendingNavControls } from './user-profile-pending-nav-context';
import { parseProfileNavHref } from './user-profile-pending-nav';

type UserProfileNavLinkProps = Omit<ComponentProps<typeof Link>, 'prefetch'> & {
  children: ReactNode;
};

function LinkPendingSync({ href }: { href: string }) {
  const { pending } = useLinkStatus();
  const { setPendingTarget } = usePendingNavControls();
  const target = useMemo(() => parseProfileNavHref(href), [href]);

  useEffect(() => {
    if (pending) {
      setPendingTarget(target);
    }
  }, [pending, target, setPendingTarget]);

  return null;
}

/**
 * Profile nav link with instant pending feedback for menu/submenu active state.
 */
export function UserProfileNavLink({
  href,
  children,
  suppressHydrationWarning = true,
  ...rest
}: UserProfileNavLinkProps) {
  const resolvedHref = typeof href === 'string' ? href : '';

  return (
    <Link href={href} prefetch={false} suppressHydrationWarning={suppressHydrationWarning} {...rest}>
      {typeof href === 'string' ? <LinkPendingSync href={resolvedHref} /> : null}
      {children}
    </Link>
  );
}
