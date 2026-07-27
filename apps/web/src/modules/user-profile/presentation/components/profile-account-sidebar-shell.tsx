'use client';

import { useHydrateWalletProvider } from '@/modules/auth';

import type { UserAccountSidebarView } from '../../domain/types/user-account-sidebar-view';
import { ProfileAccountSidebar } from './profile-account-sidebar';

export type ProfileAccountSidebarShellProps = {
  accountName: string;
  viewerUsername: string | null;
  model: UserAccountSidebarView;
};

export function ProfileAccountSidebarShell({
  accountName,
  viewerUsername,
  model,
}: ProfileAccountSidebarShellProps) {
  useHydrateWalletProvider();
  const viewerAccount = viewerUsername?.trim() ?? null;

  return (
    <ProfileAccountSidebar
      accountName={accountName}
      viewerUsername={viewerAccount}
      model={model}
    />
  );
}
