import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';
import {
  buildInitialWaivAdvancedReportRequest,
  WaivAdvancedReportTable,
} from '@/modules/user-wallet';
import { WaivAdvancedReportGeneratedTab } from '@/modules/user-wallet/presentation/components/waiv/advanced-report/waiv-advanced-report-generated-tab';
import { WaivAdvancedReportTabs } from '@/modules/user-wallet/presentation/components/waiv/advanced-report/waiv-advanced-report-tabs';

type UserProfileWaivTablePageProps = {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ tab?: string; reportId?: string }>;
};

function resolveTab(raw: string | undefined): 'standard' | 'generate' {
  return raw === 'generate' ? 'generate' : 'standard';
}

export default async function UserProfileWaivTablePage({
  params,
  searchParams,
}: UserProfileWaivTablePageProps) {
  const { name } = await params;
  const { tab: tabRaw, reportId } = await searchParams;
  const tab = resolveTab(tabRaw);
  const accountName = decodeURIComponent(name);
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const initialRequest = buildInitialWaivAdvancedReportRequest({
    profileAccount: accountName,
    viewer: user?.username ?? null,
  });
  const basePath = `/@${encodeURIComponent(accountName)}/transfers/waiv-table`;

  return (
    <div className="w-full min-w-0">
      <WaivAdvancedReportTabs basePath={basePath} activeTab={tab} />

      {tab === 'generate' ? (
        <WaivAdvancedReportGeneratedTab
          basePath={basePath}
          profileAccount={accountName}
          viewerUsername={user?.username ?? null}
          reportId={reportId ?? null}
        />
      ) : (
        <WaivAdvancedReportTable
          profileAccount={accountName}
          viewerUsername={user?.username ?? null}
          initialRequest={initialRequest}
          initialResult={{ report: null, error: null }}
          backHref={`/@${encodeURIComponent(accountName)}/transfers?type=WAIV`}
        />
      )}
    </div>
  );
}
