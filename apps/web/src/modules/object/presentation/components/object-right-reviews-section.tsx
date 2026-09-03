'use client';

import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import type { UserBlogFeedPage } from '@/modules/feed/application/dto/user-blog-feed-page.dto';
import { FeedList } from '@/modules/feed/presentation';

const MOBILE_REVIEWS_MAX_ITEMS = 5;

export type ObjectRightReviewsSectionProps = {
  objectId: string;
  page: UserBlogFeedPage;
  currentUsername: string | null;
};

export function ObjectRightReviewsSection({
  objectId,
  page,
  currentUsername,
}: ObjectRightReviewsSectionProps) {
  const { t } = useI18n();
  const visible = page.items.slice(0, MOBILE_REVIEWS_MAX_ITEMS);
  const hasMore = page.hasMore || page.items.length > MOBILE_REVIEWS_MAX_ITEMS;

  if (visible.length === 0) {
    return null;
  }

  const showMoreHref = `/object/${encodeURIComponent(objectId)}/reviews`;

  return (
    <aside className="w-full rounded-card border border-border bg-surface/60 px-3 py-card-padding text-body-sm text-muted">
      <h2 className="text-section font-weight-strong text-fg">{t('reviews')}</h2>
      <div className="mt-3">
        <FeedList
          items={visible}
          feedTab="posts"
          currentUsername={currentUsername}
        />
      </div>
      {hasMore ? (
        <Link
          href={showMoreHref}
          className="mt-3 inline-block text-body-sm font-weight-label text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          suppressHydrationWarning
        >
          {t('object_right_show_more')}
        </Link>
      ) : null}
    </aside>
  );
}
