import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

import { getUserAccountSidebarQuery } from '../../application/queries/get-user-account-sidebar.query';
import { ProfileAccountSidebarShell } from '../components/profile-account-sidebar-shell';

export async function renderProfileAccountSidebar(accountName: string) {
  const model = await getUserAccountSidebarQuery(accountName);
  if (!model) {
    return null;
  }

  const auth = createCookieAuthContextProvider();
  const viewer = await auth.getUser();
  const viewerUsername = viewer?.username ?? null;

  return (
    <ProfileAccountSidebarShell
      accountName={accountName}
      viewerUsername={viewerUsername}
      model={model}
    />
  );
}
