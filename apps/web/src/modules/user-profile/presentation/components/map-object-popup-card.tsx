'use client';

import Image from 'next/image';

import { mergeRatingDimensions } from '@/modules/feed/application/dto/object-card-rating';
import type { ProjectedObjectView } from '@/modules/feed/application/dto/object-fields';
import { objectFields } from '@/modules/feed/application/dto/object-fields';
import { ObjectPageLink } from '@/modules/feed/presentation/components/object-page-link';
import { getRatingDimensionNamesForObjectType } from '@/modules/discover/domain/discover-registry';
import { StarRating } from '@/modules/object/presentation/components/star-rating';
import { AVATAR_PLACEHOLDER_SRC, shouldUnoptimizeRemoteImage } from '@/shared/presentation';
import { objectPagePath } from '@/shared/routes/object-page-path';
import { useI18n } from '@/i18n/providers/i18n-provider';

import { formatFavoritesTypeLabel } from './favorites-type-label';

const POPUP_THUMB_SIZE = 88;

export type MapObjectPopupCardProps = {
  object: ProjectedObjectView;
};

export function MapObjectPopupCard({ object: o }: MapObjectPopupCardProps) {
  const { t } = useI18n();
  const thumbUrl = objectFields.image(o);
  const name = objectFields.name(o);
  const titleLabel = name ?? o.object_id;
  const href = objectPagePath(o.object_id);
  const typeLabel = o.object_type?.trim()
    ? formatFavoritesTypeLabel(o.object_type.trim())
    : '';
  const categoryLabels = objectFields.tagCategoryLabels(o);
  const subtitleParts = [typeLabel, ...categoryLabels.filter(Boolean)].filter(Boolean);
  const subtitle = subtitleParts.join(' · ');
  const objectTypeKey = o.object_type?.trim() ?? '';
  const ratingDims = mergeRatingDimensions(
    getRatingDimensionNamesForObjectType(objectTypeKey),
    objectFields.aggregateRatingAspects(o),
  );
  const primaryRating = ratingDims[0];
  const goToLabel = t('profile_map_go_to_object').replace('{name}', titleLabel);

  return (
    <ObjectPageLink
      href={href}
      title={goToLabel}
      ariaLabel={goToLabel}
      className="flex gap-3 bg-surface p-3 hover:bg-surface-control/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <span
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-btn border-[0.5px] border-border bg-surface-alt"
        style={{ width: POPUP_THUMB_SIZE, height: POPUP_THUMB_SIZE }}
      >
        {thumbUrl ? (
          <Image
            src={thumbUrl}
            alt=""
            className="size-full object-cover"
            width={POPUP_THUMB_SIZE}
            height={POPUP_THUMB_SIZE}
            sizes={`${POPUP_THUMB_SIZE}px`}
            unoptimized={shouldUnoptimizeRemoteImage(thumbUrl)}
          />
        ) : (
          <Image
            src={AVATAR_PLACEHOLDER_SRC}
            alt=""
            className="size-full object-cover"
            width={POPUP_THUMB_SIZE}
            height={POPUP_THUMB_SIZE}
            sizes={`${POPUP_THUMB_SIZE}px`}
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-weight-label text-body text-accent hover:underline">
          {titleLabel}
        </span>
        {primaryRating ? (
          <span className="mt-1 flex min-w-0 items-center gap-1.5">
            <StarRating
              averageRating01To5={primaryRating.averageRating01To5}
              userRating01To5={primaryRating.userRating01To5}
              totalVoters={primaryRating.totalVoters}
              dimension={primaryRating.dimension}
              updateId={primaryRating.update_id ?? ''}
              objectId={o.object_id}
              readOnly
              size="sm"
              showNumeric={false}
            />
            <span className="truncate text-caption text-fg-secondary">{primaryRating.dimension}</span>
          </span>
        ) : null}
        {subtitle ? (
          <span className="mt-1 block truncate text-caption text-fg-secondary">{subtitle}</span>
        ) : null}
      </span>
    </ObjectPageLink>
  );
}
