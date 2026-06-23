'use client';

import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { useCallback, useContext } from 'react';

import { PendingNavControlsContext } from './optimistic-nav-context';
import { useInstantNavigation } from './use-instant-navigation';

type OptimisticTabButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick'
> & {
  href: string;
  method?: 'push' | 'replace';
  onNavigate?: () => void;
};

/**
 * Tab button that updates URL and active state instantly, then triggers App Router navigation.
 */
export function OptimisticTabButton({
  href,
  method = 'replace',
  onNavigate,
  type = 'button',
  ...rest
}: OptimisticTabButtonProps) {
  const { navigateInstant } = useInstantNavigation();
  const pendingControls = useContext(PendingNavControlsContext);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onNavigate?.();
      navigateInstant({
        href,
        method,
        scroll: false,
        onPending: pendingControls?.setPendingTarget,
      });
    },
    [href, method, navigateInstant, onNavigate, pendingControls],
  );

  return <button type={type} onClick={handleClick} {...rest} />;
}
