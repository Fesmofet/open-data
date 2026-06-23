'use client';

import type { ComponentProps, ReactNode } from 'react';

import { OptimisticNavLink } from '@/shared/presentation';

type UserProfileNavLinkProps = Omit<ComponentProps<typeof OptimisticNavLink>, 'prefetch'> & {
  children: ReactNode;
};

/**
 * Profile nav link with instant URL + optimistic active state on click.
 */
export function UserProfileNavLink({
  children,
  suppressHydrationWarning = true,
  ...rest
}: UserProfileNavLinkProps) {
  return (
    <OptimisticNavLink suppressHydrationWarning={suppressHydrationWarning} {...rest}>
      {children}
    </OptimisticNavLink>
  );
}
