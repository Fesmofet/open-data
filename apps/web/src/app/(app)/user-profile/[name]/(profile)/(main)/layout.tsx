import type { ReactNode } from 'react';

import {
  FixedRegion,
  FeedColumn,
  HiddenBelow,
} from '@/shared/presentation/layout';
import {
  RightSidebar,
  UserMenuVerticalRail,
  UserProfileMainContentPendingShell,
  UserProfileSubmenu,
} from '@/modules/user-profile';

/**
 * Profile `(main)` shell — parity with {@link ObjectViewShell}.
 * @see apps/web/src/modules/object/presentation/components/object-view-shell.tsx
 */
export default async function UserProfileMainShellLayout({
  children,
  leftSidebar,
  params,
}: {
  children: ReactNode;
  leftSidebar: ReactNode;
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const accountName = decodeURIComponent(name);

  return (
    <div
      className={[
        'shell-profile-grid mt-card-padding grid grid-cols-1 gap-card-padding',
        'lg:grid-cols-[minmax(0,var(--shell-left-width))_minmax(0,1fr)_minmax(0,var(--shell-right-width))]',
      ].join(' ')}
    >
      <HiddenBelow breakpoint="lg" className="min-w-0">
        <div className="shell-profile-left-rail shell-hide-instagram lg:contents">
          <div className="shell-hide-twitter lg:contents">{leftSidebar}</div>
          <div className="shell-show-twitter">
            <FixedRegion>
              <UserMenuVerticalRail accountName={accountName} />
            </FixedRegion>
          </div>
        </div>
      </HiddenBelow>

      <main className="min-h-[12rem] min-w-0">
        <FeedColumn>
          <UserProfileSubmenu accountName={accountName} />
          <UserProfileMainContentPendingShell>
            {children}
          </UserProfileMainContentPendingShell>
        </FeedColumn>
      </main>

      <HiddenBelow breakpoint="lg" className="min-w-0">
        <div className="shell-hide-instagram lg:contents">
          <RightSidebar accountName={accountName} />
        </div>
      </HiddenBelow>
    </div>
  );
}
