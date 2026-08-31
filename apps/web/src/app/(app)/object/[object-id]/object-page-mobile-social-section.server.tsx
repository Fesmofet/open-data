import { getObjectPostsFeedPageQuery } from '@/modules/feed';
import { getObjectFollowersPageQuery } from '@/modules/object/application/queries/get-object-followers-page.query';
import { getObjectExpertsPageQuery } from '@/modules/object/application/queries/get-object-experts-page.query';
import {
  MOBILE_REVIEWS_PREVIEW_FETCH_LIMIT,
  RIGHT_RAIL_EXPERTS_FETCH_LIMIT,
  RIGHT_RAIL_FOLLOWERS_FETCH_LIMIT,
} from '@/modules/object/infrastructure/clients/object-social.client';
import { ObjectRightExpertsSection } from '@/modules/object/presentation/components/object-right-experts-section';
import { ObjectRightFollowersSection } from '@/modules/object/presentation/components/object-right-followers-section';
import { ObjectRightReviewsSection } from '@/modules/object/presentation/components/object-right-reviews-section';

export type ObjectPageMobileSocialSectionProps = {
  objectId: string;
  locale: string;
  viewerUsername: string | null;
  followersTabCount: number;
  expertsTabCount: number;
};

/** Reviews, followers, and experts previews for standard-object mobile Details landing. */
export async function ObjectPageMobileSocialSection({
  objectId,
  locale: _locale,
  viewerUsername,
  followersTabCount,
  expertsTabCount,
}: ObjectPageMobileSocialSectionProps) {
  const [reviewsPage, followersPage, expertsPage] = await Promise.all([
    getObjectPostsFeedPageQuery(
      objectId,
      { limit: MOBILE_REVIEWS_PREVIEW_FETCH_LIMIT },
      viewerUsername,
    ),
    followersTabCount > 0
      ? getObjectFollowersPageQuery(
          objectId,
          { sort: 'rank', skip: 0, limit: RIGHT_RAIL_FOLLOWERS_FETCH_LIMIT },
          viewerUsername,
        )
      : Promise.resolve(null),
    expertsTabCount > 0
      ? getObjectExpertsPageQuery(
          objectId,
          { skip: 0, limit: RIGHT_RAIL_EXPERTS_FETCH_LIMIT },
          viewerUsername,
        )
      : Promise.resolve(null),
  ]);

  const followersPreview =
    followersPage != null && followersPage.items.length > 0 ? followersPage : null;
  const expertsPreview =
    expertsPage != null && expertsPage.items.length > 0 ? expertsPage : null;

  const hasReviews = reviewsPage.items.length > 0;
  const hasFollowers = followersPreview != null;
  const hasExperts = expertsPreview != null;

  if (!hasReviews && !hasFollowers && !hasExperts) {
    return null;
  }

  return (
    <div className="flex flex-col gap-card-padding">
      {hasReviews ? (
        <ObjectRightReviewsSection
          objectId={objectId}
          page={reviewsPage}
          currentUsername={viewerUsername}
        />
      ) : null}
      {hasFollowers ? (
        <ObjectRightFollowersSection objectId={objectId} page={followersPreview} />
      ) : null}
      {hasExperts ? (
        <ObjectRightExpertsSection objectId={objectId} page={expertsPreview} />
      ) : null}
    </div>
  );
}
