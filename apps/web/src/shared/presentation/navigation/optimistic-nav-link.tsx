'use client';

import Link from 'next/link';
import type { ComponentProps, MouseEvent, ReactNode } from 'react';
import { useCallback, useContext } from 'react';

import {
  PendingNavControlsContext,
} from './optimistic-nav-context';
import { useInstantNavigation } from './use-instant-navigation';

type OptimisticNavLinkProps = Omit<ComponentProps<typeof Link>, 'prefetch' | 'onClick'> & {
  children: ReactNode;
  /** Use `replace` for same-route query changes (default `push`). */
  method?: 'push' | 'replace';
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

/**
 * Navigation link with instant URL + optimistic active state on click.
 * Requires {@link OptimisticNavProvider} ancestor for pending active tab sync.
 */
export function OptimisticNavLink({
  href,
  children,
  method = 'push',
  suppressHydrationWarning = true,
  onClick,
  scroll = false,
  ...rest
}: OptimisticNavLinkProps) {
  const { navigateInstant } = useInstantNavigation();
  const pendingControls = useContext(PendingNavControlsContext);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) {
        return;
      }

      const resolvedHref = typeof href === 'string' ? href : '';
      if (!resolvedHref) {
        return;
      }

      event.preventDefault();
      navigateInstant({
        href: resolvedHref,
        method,
        scroll,
        onPending: pendingControls?.setPendingTarget,
      });
    },
    [href, method, navigateInstant, onClick, pendingControls, scroll],
  );

  return (
    <Link
      href={href}
      prefetch={false}
      suppressHydrationWarning={suppressHydrationWarning}
      onClick={handleClick}
      scroll={scroll}
      {...rest}
    >
      {children}
    </Link>
  );
}
