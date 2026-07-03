import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import {
  getUserProfileQuery,
  UserProfileHeroClient,
  UserProfilePendingNavRoot,
  UserProfilePendingNavSync,
  UserProfileSocialCountsProvider,
} from '@/modules/user-profile';
import { fetchExpertiseCountsForProfile } from '@/modules/user-profile/presentation/components/profile-expertise-main-content';
import { getUserFollowingObjectsPageQuery } from '@/modules/user-social';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';
import { ShellFullBleedBand, ShellInset } from '@/shared/presentation/layout';

export default async function ProfileGroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const auth = createCookieAuthContextProvider();
  const viewerUser = await auth.getUser();
  const viewer = viewerUser?.username ?? null;
  const locale = await getRequestLocale();

  const [profile, objectsHead, expertiseCounts] = await Promise.all([
    getUserProfileQuery(decoded, viewer, locale),
    getUserFollowingObjectsPageQuery(
      decoded,
      { sort: 'weight', skip: 0, limit: 0 },
      locale,
      viewer,
    ),
    fetchExpertiseCountsForProfile(decoded),
  ]);
  if (!profile) {
    notFound();
  }

  return (
    <UserProfileSocialCountsProvider
      value={{
        followerCount: profile.followerCount,
        followingCount: profile.followingCount,
        followingObjectsCount: objectsHead.total,
        hashtagsExpCount: expertiseCounts.hashtagsExpCount,
        objectsExpCount: expertiseCounts.objectsExpCount,
      }}
    >
      <UserProfilePendingNavRoot>
        <Suspense fallback={null}>
          <UserProfilePendingNavSync />
          <UserProfileHeroClient
            accountName={decoded}
            initialUser={profile}
            viewerUsername={viewer}
          />
          <ShellFullBleedBand className="shell-profile-content-band">
            <ShellInset className="pt-0">{children}</ShellInset>
          </ShellFullBleedBand>
        </Suspense>
      </UserProfilePendingNavRoot>
    </UserProfileSocialCountsProvider>
  );
}
