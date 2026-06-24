import { ProfileRouteStub } from '@/modules/user-profile';
import { getWalletTypeFromSearch } from '@/modules/user-profile/presentation/components/user-profile-subnav';
import {
  getHiveWalletSummaryQuery,
  getWaivWalletSummaryQuery,
  TransfersWalletPageClient,
  TransfersWalletShell,
} from '@/modules/user-wallet';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

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

  const [waiv, hive] = await Promise.all([
    getWaivWalletSummaryQuery(accountName),
    getHiveWalletSummaryQuery(accountName),
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
