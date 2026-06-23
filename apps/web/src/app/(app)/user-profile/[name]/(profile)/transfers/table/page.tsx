import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';
import {
  buildInitialAdvancedReportRequest,
  HiveAdvancedReportTable,
} from '@/modules/user-wallet';

type UserProfileTransfersTablePageProps = {
  params: Promise<{ name: string }>;
};

export default async function UserProfileTransfersTablePage({
  params,
}: UserProfileTransfersTablePageProps) {
  const { name } = await params;
  const accountName = decodeURIComponent(name);
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  const initialRequest = buildInitialAdvancedReportRequest({
    profileAccount: accountName,
    viewer: user?.username ?? null,
  });

  return (
    <HiveAdvancedReportTable
      profileAccount={accountName}
      viewerUsername={user?.username ?? null}
      initialRequest={initialRequest}
      initialResult={{ report: null, error: null }}
      backHref={`/@${encodeURIComponent(accountName)}/transfers?type=HIVE`}
    />
  );
}
