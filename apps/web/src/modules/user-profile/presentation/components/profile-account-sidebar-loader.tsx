import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';
import {
  getEngineWalletSummaryQuery,
  getHiveWalletSummaryQuery,
  getWaivWalletSummaryQuery,
} from '@/modules/user-wallet';

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

  if (!viewerUsername) {
    return (
      <ProfileAccountSidebarShell
        accountName={accountName}
        viewerUsername={null}
        viewerWaivSummary={null}
        viewerHiveSummary={null}
        viewerEngineSummary={null}
        model={model}
      />
    );
  }

  const [waiv, hive, engine] = await Promise.all([
    getWaivWalletSummaryQuery(viewerUsername),
    getHiveWalletSummaryQuery(viewerUsername),
    getEngineWalletSummaryQuery(viewerUsername),
  ]);

  return (
    <ProfileAccountSidebarShell
      accountName={accountName}
      viewerUsername={viewerUsername}
      viewerWaivSummary={waiv.summary}
      viewerHiveSummary={hive.summary}
      viewerEngineSummary={engine.summary}
      model={model}
    />
  );
}
