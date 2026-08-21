import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import {
  getUserAccountSidebarQuery,
  getUserProfileQuery,
  UserProfileHeroClient,
  UserProfilePendingNavRoot,
  UserProfilePendingNavSync,
  UserProfileSocialCountsProvider,
} from '@/modules/user-profile';
import { getUserFeedUnreadCountsQuery } from '@/modules/user-profile/application/queries/get-user-feed-unread-counts.query';
import { ProfileFeedTabMarkReadEffect } from '@/modules/user-profile/presentation/components/profile-feed-tab-mark-read';
import { UserProfileFeedUnreadProvider } from '@/modules/user-profile/presentation/components/user-profile-feed-unread-context';
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

  const [profile, sidebar, objectsHead, expertiseCounts, feedUnreadCounts] = await Promise.all([
    getUserProfileQuery(decoded, viewer, locale),
    getUserAccountSidebarQuery(decoded),
    getUserFollowingObjectsPageQuery(
      decoded,
      { sort: 'weight', skip: 0, limit: 0 },
      locale,
      viewer,
    ),
    fetchExpertiseCountsForProfile(decoded),
    getUserFeedUnreadCountsQuery(decoded, viewer),
  ]);
  if (!profile) {
    notFound();
  }

  return (
    <UserProfileFeedUnreadProvider value={feedUnreadCounts}>
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
          <ProfileFeedTabMarkReadEffect
            accountName={decoded}
            viewerUsername={viewer}
          />
          <UserProfileHeroClient
            accountName={decoded}
            initialUser={profile}
            sidebar={sidebar}
            viewerUsername={viewer}
          />
          <ShellFullBleedBand className="shell-profile-content-band">
            <ShellInset className="pt-0">{children}</ShellInset>
          </ShellFullBleedBand>
        </Suspense>
      </UserProfilePendingNavRoot>
    </UserProfileSocialCountsProvider>
    </UserProfileFeedUnreadProvider>
  );
}
