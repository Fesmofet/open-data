import type { ReactNode } from 'react';

/** Prevent page scroll: messaging viewport fills remaining column height; scroll stays inside panels. */
export default function ProfileMessagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-mb-section-y-sm min-h-0 overflow-hidden">{children}</div>
  );
}
