'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  buildObjectAddOnPath,
  buildObjectFieldReferencesPath,
  buildObjectRelatedPath,
  buildObjectSimilarPath,
} from '../../domain/object-page-url.constants';
import type { ObjectRefCardView } from '../../domain/object-page.types';
import type { ObjectFieldReferenceGroupView } from '../../infrastructure/object-field-references.client';
import type { PaginatedUserFollowListView } from '@/modules/user-social/application/dto/user-social.dto';
import type { PaginatedObjectExpertListView } from '@/modules/object/domain/types/object-experts';

import { ObjectRefCard } from './object-ref-list-feed';
import { ObjectRightExpertsSection } from './object-right-experts-section';
import { ObjectRightFollowersSection } from './object-right-followers-section';

const RIGHT_RAIL_MAX_ITEMS = 5;

export type ObjectRightSidebarProps = {
  objectId: string;
  related: ObjectRefCardView[];
  similar: ObjectRefCardView[];
  addOn: ObjectRefCardView[];
  relatedHasMore: boolean;
  similarHasMore: boolean;
  addOnHasMore: boolean;
  fieldReferenceGroups: ObjectFieldReferenceGroupView[];
  rightRailFollowersPage: PaginatedUserFollowListView | null;
  rightRailExpertsPage: PaginatedObjectExpertListView | null;
};

function BookSectionIcon() {
  return (
    <svg
      viewBox="64 64 896 896"
      focusable="false"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden
      className="shrink-0"
    >
      <path d="M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-260 72h96v209.9L621.5 312 572 347.4V136zm220 752H232V136h280v296.9c0 3.3 1 6.6 3 9.3a15.9 15.9 0 0 0 22.3 3.7l83.8-59.9 81.4 59.4c2.7 2 6 3.1 9.4 3.1 8.8 0 16-7.2 16-16V136h64v752z" />
    </svg>
  );
}

function ObjectRefSection({
  title,
  titleIcon,
  items,
  hasMore,
  showMoreHref,
}: {
  title: string;
  titleIcon?: ReactNode;
  items: ObjectRefCardView[];
  hasMore: boolean;
  showMoreHref: string;
}) {
  const { t } = useI18n();
  if (items.length === 0) {
    return null;
  }

  const visible = items.slice(0, RIGHT_RAIL_MAX_ITEMS);

  return (
    <aside className="w-full rounded-card border border-border bg-surface/60 px-3 py-card-padding text-body-sm text-muted">
      <p className="flex items-center gap-1.5 font-weight-label text-fg">
        {titleIcon}
        {title}
      </p>
      <ul className="mt-3 w-full space-y-2">
        {visible.map((item) => (
          <li key={item.objectId} className="w-full">
            <ObjectRefCard
              item={item}
              href={`/object/${encodeURIComponent(item.objectId)}`}
            />
          </li>
        ))}
      </ul>
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

function fieldReferenceSectionTitle(
  t: (key: string) => string,
  objectType: string,
): string {
  if (objectType === 'book') {
    return t('books');
  }
  if (objectType === 'product') {
    return t('products');
  }
  const typeKey = `object_type_${objectType.replace(/&/g, '')}`;
  const label = t(typeKey);
  return label !== typeKey ? label : t('references');
}

/** Matches profile `RightSidebar` surface tokens (`rounded-card`, `border-border`, `bg-surface/60`). */
export function ObjectRightSidebar({
  objectId,
  related,
  similar,
  addOn,
  relatedHasMore,
  similarHasMore,
  addOnHasMore,
  fieldReferenceGroups,
  rightRailFollowersPage,
  rightRailExpertsPage,
}: ObjectRightSidebarProps) {
  const { t } = useI18n();

  return (
    <div className="flex w-full min-w-0 flex-col gap-card-padding">
      <ObjectRefSection
        title={t('object_right_related')}
        items={related}
        hasMore={relatedHasMore}
        showMoreHref={buildObjectRelatedPath(objectId)}
      />
      <ObjectRefSection
        title={t('object_right_similar')}
        items={similar}
        hasMore={similarHasMore}
        showMoreHref={buildObjectSimilarPath(objectId)}
      />
      <ObjectRefSection
        title={t('object_right_add_on')}
        items={addOn}
        hasMore={addOnHasMore}
        showMoreHref={buildObjectAddOnPath(objectId)}
      />
      {fieldReferenceGroups.map((group) => (
        <ObjectRefSection
          key={group.objectType}
          title={fieldReferenceSectionTitle(t, group.objectType)}
          titleIcon={group.objectType === 'book' ? <BookSectionIcon /> : undefined}
          items={group.items}
          hasMore={group.hasMore}
          showMoreHref={buildObjectFieldReferencesPath(objectId, group.objectType)}
        />
      ))}
      {rightRailExpertsPage != null ? (
        <ObjectRightExpertsSection objectId={objectId} page={rightRailExpertsPage} />
      ) : null}
      {rightRailFollowersPage != null ? (
        <ObjectRightFollowersSection objectId={objectId} page={rightRailFollowersPage} />
      ) : null}
    </div>
  );
}
