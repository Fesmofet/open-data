import type { ActivityPageQueryResult } from '@/modules/user-activity/domain/types/activity-row-view';
import { ProfileRouteStub } from '@/modules/user-profile';
import { getWalletTypeFromSearch } from '@/modules/user-profile/presentation/components/user-profile-subnav';
import {
  getHiveWalletHistoryPageQuery,
  getHiveWalletSummaryQuery,
  getWaivWalletSummaryQuery,
  TransfersWalletPageClient,
  TransfersWalletShell,
} from '@/modules/user-wallet';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

const EMPTY_HISTORY: ActivityPageQueryResult = {
  page: {
    items: [],
    cursor: null,
    hasMore: false,
    chainContext: { totalVestingShares: '0', totalVestingFundSteem: '0' },
  },
  error: null,
};

type UserProfileTransfersPageProps = {
  params: Promise<{ name: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function searchParamsToQuery(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') {
      params.set(key, value);
    } else if (Array.isArray(value) && value[0]) {
      params.set(key, value[0]);
    }
  }
  return params.toString();
}

export default async function UserProfileTransfersPage({
  params,
  searchParams,
}: UserProfileTransfersPageProps) {
  const { name } = await params;
  const accountName = decodeURIComponent(name);
  const walletType = getWalletTypeFromSearch(
    searchParamsToQuery(await searchParams),
  );

  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();

  const [waiv, hive, hiveHistory] = await Promise.all([
    getWaivWalletSummaryQuery(accountName),
    getHiveWalletSummaryQuery(accountName),
    walletType === 'HIVE'
      ? getHiveWalletHistoryPageQuery(accountName)
      : Promise.resolve(EMPTY_HISTORY),
  ]);

  if (walletType === 'HIVE' || walletType === 'WAIV') {
    return (
      <TransfersWalletPageClient>
        <TransfersWalletShell
          accountName={accountName}
          viewerUsername={user?.username ?? null}
          walletType={walletType}
          waivSummary={waiv.summary}
          waivError={waiv.error}
          hiveSummary={hive.summary}
          hiveError={hive.error}
          hiveHistoryPage={hiveHistory.page}
          hiveHistoryError={hiveHistory.error}
        />
      </TransfersWalletPageClient>
    );
  }

  return (
    <ProfileRouteStub
      title="Wallet / transfers"
      description="Wallet tabs (WAIV, HIVE, Engine) driven by ?type= query."
    />
  );
}
