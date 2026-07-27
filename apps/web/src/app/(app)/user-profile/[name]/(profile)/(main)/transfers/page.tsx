import { ProfileRouteStub } from '@/modules/user-profile';
import { getWalletTypeFromSearch } from '@/modules/user-profile/presentation/components/user-profile-subnav';
import {
  getEngineWalletSummaryQuery,
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

  const loadsWalletSummaries =
    walletType === 'WAIV' || walletType === 'HIVE' || walletType === 'ENGINE';

  const [waiv, hive, engine] = await Promise.all([
    loadsWalletSummaries
      ? getWaivWalletSummaryQuery(accountName)
      : Promise.resolve({ summary: null, error: null }),
    loadsWalletSummaries
      ? getHiveWalletSummaryQuery(accountName)
      : Promise.resolve({ summary: null, error: null }),
    loadsWalletSummaries
      ? getEngineWalletSummaryQuery(accountName)
      : Promise.resolve({ summary: null, error: null }),
  ]);

  if (walletType === 'HIVE' || walletType === 'WAIV') {
    return (
      <TransfersWalletPageClient
        accountName={accountName}
        viewerUsername={user?.username ?? null}
        waivSummary={waiv.summary}
        hiveSummary={hive.summary}
        engineSummary={engine.summary}
      >
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

  if (walletType === 'ENGINE') {
    return (
      <TransfersWalletPageClient
        accountName={accountName}
        viewerUsername={user?.username ?? null}
        waivSummary={waiv.summary}
        hiveSummary={hive.summary}
        engineSummary={engine.summary}
      >
        <TransfersWalletShell
          accountName={accountName}
          viewerUsername={user?.username ?? null}
          walletType={walletType}
          waivSummary={waiv.summary}
          waivError={waiv.error}
          hiveSummary={hive.summary}
          hiveError={hive.error}
          engineSummary={engine.summary}
          engineError={engine.error}
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
