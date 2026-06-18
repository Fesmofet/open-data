import type { ReactNode } from 'react';

import { ActivityTimestamp } from './activity-timestamp';

type ActivityRowShellProps = {
  icon?: ReactNode;
  avatarUsername?: string | null;
  children: ReactNode;
  timestamp: string;
  secondary?: ReactNode;
};

export function ActivityRowShell({
  icon,
  children,
  timestamp,
  secondary,
}: ActivityRowShellProps) {
  return (
    <article className="rounded-card border border-border bg-surface/80 p-card-padding">
      <div className="flex gap-3">
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center text-muted" aria-hidden>
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="text-body-sm text-fg">{children}</div>
          <ActivityTimestamp
            timestamp={timestamp}
            className="mt-1 block text-caption text-muted"
          />
          {secondary ? <div className="mt-2">{secondary}</div> : null}
        </div>
      </div>
    </article>
  );
}
