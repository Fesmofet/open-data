'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';

import { ObjectPageLink } from './object-page-link';

import type { CardRatingDimension } from '../../application/dto/object-card-rating';
import { mergeRatingDimensions } from '../../application/dto/object-card-rating';
import {
  OBJECT_CARD_DESCRIPTION_MAX_LENGTH,
  OBJECT_CARD_MAP_SIDEBAR_DESCRIPTION_MAX_LENGTH,
  truncateObjectCardDescription,
} from '../../application/dto/object-card-description';
import type { ProjectedObjectView } from '../../application/dto/object-fields';
import { objectFields } from '../../application/dto/object-fields';
import { getRatingDimensionNamesForObjectType } from '@/modules/discover/domain/discover-registry';
import { AVATAR_PLACEHOLDER_SRC, ObjectThumbnail } from '@/shared/presentation';
import { StarRating } from '@/modules/object/presentation/components/star-rating';
import { AdministrativeHeartButton } from '@/modules/object/presentation/components/administrative-heart-button';
import { objectPagePath } from '@/shared/routes/object-page-path';

const THUMB_SIZE = 120;
const MAP_SIDEBAR_THUMB_SIZE = 88;

function CardNavTarget({
  href,
  linkReplace,
  onNavigate,
  onPendingChange,
  className,
  ariaLabel,
  children,
}: {
  href: string;
  linkReplace: boolean;
  onNavigate?: () => void;
  onPendingChange?: (pending: boolean) => void;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  if (onNavigate) {
    return (
      <button type="button" className={className} aria-label={ariaLabel} onClick={onNavigate}>
        {children}
      </button>
    );
  }
  return (
    <ObjectPageLink
      href={href}
      replace={linkReplace}
      ariaLabel={ariaLabel}
      className={className}
      onPendingChange={onPendingChange}
    >
      {children}
    </ObjectPageLink>
  );
}

function formatLinkedObjectTypeLabel(type: string | null): string {
  if (type == null || type.trim() === '') {
    return '';
  }
  return type
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function RatingsGrid({
  dims,
  objectId,
  viewerUsername,
  onRequireLogin,
  compact = false,
  mobileMaxVisible,
}: {
  dims: CardRatingDimension[];
  objectId: string;
  viewerUsername?: string | null;
  onRequireLogin?: () => void;
  /** Single row — for narrow columns (profile map sidebar). */
  compact?: boolean;
  /** Hide rating rows beyond this count below the `sm` breakpoint. */
  mobileMaxVisible?: number;
}) {
  if (dims.length === 0) {
    return null;
  }
  return (
    <div
      className={
        compact
          ? 'mt-1.5 flex min-w-0 items-center gap-1.5'
          : 'mt-2 grid grid-cols-1 gap-y-1.5 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-1'
      }
    >
      {dims.map(
        ({ dimension, update_id, averageRating01To5, userRating01To5, totalVoters }, index) => (
          <div
            key={dimension}
            className={[
              compact
                ? 'flex min-w-0 flex-col items-start gap-0.5'
                : 'flex min-w-0 flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-1.5',
              mobileMaxVisible != null && index >= mobileMaxVisible ? 'hidden sm:flex' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <StarRating
              averageRating01To5={averageRating01To5}
              userRating01To5={userRating01To5}
              totalVoters={totalVoters}
              dimension={dimension}
              updateId={update_id ?? ''}
              valueText={update_id ? undefined : dimension}
              objectId={objectId}
              viewerUsername={viewerUsername}
              onRequireLogin={onRequireLogin}
              size="sm"
              showNumeric={false}
            />
            <span className="max-w-full text-caption text-fg-secondary sm:truncate">{dimension}</span>
          </div>
        ),
      )}
    </div>
  );
}

export type ObjectCardProps = {
  object: ProjectedObjectView;
  /** When navigating from an intercepted-route modal (`@modal`), replaces the post URL so the modal slot resets. */
  linkReplace?: boolean;
  /** When set, thumb/title use a button (in-column catalog nav) instead of object page links. */
  onNavigate?: () => void;
  /** Root element — `li` in feeds; `div` when mixed with non-list rows (object page catalog). */
  as?: 'li' | 'div';
  viewerUsername?: string | null;
  onRequireLogin?: () => void;
  /** Post editor: hide admin heart and use compact row with trailing controls. */
  layout?: 'default' | 'editorRow' | 'mapSidebar' | 'catalog';
  hideAdministrativeHeart?: boolean;
  /** Post editor: toggle + slider column on the right. */
  trailing?: ReactNode;
  /** Rendered inline after the title (e.g. catalog reject in edit mode). */
  titleSuffix?: ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  /** Fired after administrative heart toggle succeeds (e.g. profile map refetch). */
  onAdministrativeAuthorityChange?: () => void;
  /** User expertise weight on this object (profile expertise tab). */
  userWeight?: number;
};

/**
 * Shop / feed card: thumbnail, brand/parent caption, title, price · type · categories, rating, excerpt, admin heart.
 */
export function ObjectCard({
  object: o,
  linkReplace = false,
  onNavigate,
  as: Root = 'li',
  viewerUsername,
  onRequireLogin,
  layout = 'default',
  hideAdministrativeHeart = false,
  trailing,
  titleSuffix,
  onMouseEnter,
  onMouseLeave,
  onAdministrativeAuthorityChange,
  userWeight,
}: ObjectCardProps) {
  const editorRow = layout === 'editorRow';
  const mapSidebar = layout === 'mapSidebar';
  const catalog = layout === 'catalog';
  const stackedMobile = layout === 'default';
  const horizontalRow = !stackedMobile;
  const thumbSize = editorRow ? 72 : mapSidebar ? MAP_SIDEBAR_THUMB_SIZE : THUMB_SIZE;
  const typeLabel = formatLinkedObjectTypeLabel(o.object_type);
  const categoryLabels = objectFields.tagCategoryLabels(o);
  const priceLabel = objectFields.price(o);
  const brandOrParentLabel = objectFields.brandOrParentLabel(o);
  const subtitleParts = [priceLabel, typeLabel, ...categoryLabels.filter(Boolean)].filter(Boolean);
  const subtitle = subtitleParts.join(' · ');
  const thumbUrl = objectFields.image(o);
  const name = objectFields.name(o);
  const descriptionRaw = objectFields.description(o);
  const description = descriptionRaw
    ? truncateObjectCardDescription(
        descriptionRaw,
        mapSidebar ? OBJECT_CARD_MAP_SIDEBAR_DESCRIPTION_MAX_LENGTH : OBJECT_CARD_DESCRIPTION_MAX_LENGTH,
      )
    : undefined;
  const href = objectPagePath(o.object_id);
  const titleLabel = name ?? o.object_id;
  const objectTypeKey = o.object_type?.trim() ?? '';
  const ratingDims = mergeRatingDimensions(
    getRatingDimensionNamesForObjectType(objectTypeKey),
    objectFields.aggregateRatingAspects(o),
  );
  const visibleRatingDims = mapSidebar ? ratingDims.slice(0, 1) : ratingDims;

  const [navPending, setNavPending] = useState(false);
  const navPendingCountRef = useRef(0);
  const onNavPendingChange = useCallback((pending: boolean) => {
    navPendingCountRef.current += pending ? 1 : -1;
    if (navPendingCountRef.current < 0) {
      navPendingCountRef.current = 0;
    }
    setNavPending(navPendingCountRef.current > 0);
  }, []);

  const rootClassName = [
    'relative list-none border-[0.5px] border-border bg-surface-control/40 shadow-whisper',
    mapSidebar
      ? 'rounded-card py-card-padding pe-card-padding ps-gutter sm:ps-gutter-sm'
      : stackedMobile
        ? 'rounded-card p-3 sm:p-card-padding'
        : 'rounded-card p-card-padding',
    navPending ? 'opacity-90' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const showHeart = !hideAdministrativeHeart && !editorRow;

  return (
    <Root
      className={rootClassName}
      aria-busy={navPending || undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {showHeart ? (
        <div className="absolute end-3 top-3">
          <AdministrativeHeartButton
            objectId={o.object_id}
            initialActive={o.isFavorited ?? false}
            viewerUsername={viewerUsername}
            onRequireLogin={onRequireLogin}
            onFavoriteChange={onAdministrativeAuthorityChange}
          />
        </div>
      ) : null}
      {userWeight != null ? (
        <div
          className={[
            'absolute end-3 rounded-btn border border-border bg-surface-alt px-2 py-0.5 text-caption text-fg',
            showHeart ? 'top-12' : 'top-3',
          ].join(' ')}
        >
          {userWeight.toFixed(2)}
        </div>
      ) : null}
      <div
        className={[
          'flex gap-3',
          horizontalRow ? 'flex-row items-start' : 'flex-col sm:flex-row sm:items-start',
          showHeart || userWeight != null ? (stackedMobile ? 'sm:pe-8' : 'pe-8') : '',
          trailing && horizontalRow ? 'items-start' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <CardNavTarget
          href={href}
          linkReplace={linkReplace}
          onNavigate={onNavigate}
          onPendingChange={onNavPendingChange}
          ariaLabel={`View object: ${titleLabel}`}
          className={[
            'rounded-btn focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
            stackedMobile ? 'w-full shrink-0 sm:w-auto' : 'shrink-0',
          ].join(' ')}
        >
          <span
            className={[
              'flex items-center justify-center overflow-hidden rounded-btn border-[0.5px] border-border bg-surface-alt',
              stackedMobile ? 'aspect-[4/3] w-full sm:aspect-auto sm:size-[120px]' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={stackedMobile ? undefined : { width: thumbSize, height: thumbSize }}
          >
            {thumbUrl ? (
              <ObjectThumbnail
                src={thumbUrl}
                size={thumbSize}
                avatarSize={thumbSize <= 64 ? 'small' : 'large'}
                className="size-full object-cover"
                sizes={`${thumbSize}px`}
              />
            ) : (
              <Image
                src={AVATAR_PLACEHOLDER_SRC}
                alt=""
                className="size-full object-cover"
                width={thumbSize}
                height={thumbSize}
                sizes={`${thumbSize}px`}
                loading="lazy"
              />
            )}
          </span>
        </CardNavTarget>
        <div className="min-w-0 flex-1">
          {brandOrParentLabel ? (
            <p className="text-caption text-fg-secondary">{brandOrParentLabel}</p>
          ) : null}
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-1">
            <CardNavTarget
              href={href}
              linkReplace={linkReplace}
              onNavigate={onNavigate}
              onPendingChange={onNavPendingChange}
              className={[
                'max-w-full text-left font-weight-label text-body text-heading hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                stackedMobile
                  ? 'line-clamp-2 sm:line-clamp-none'
                  : catalog
                    ? 'line-clamp-2'
                    : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {titleLabel}
            </CardNavTarget>
            {titleSuffix}
          </div>
          {subtitle ? (
            <p
              className={[
                'mt-0.5 text-caption text-fg-secondary',
                stackedMobile
                  ? 'line-clamp-2 sm:line-clamp-none'
                  : catalog
                    ? 'line-clamp-2'
                    : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {subtitle}
            </p>
          ) : null}
          {!editorRow ? (
            <RatingsGrid
              dims={visibleRatingDims}
              objectId={o.object_id}
              viewerUsername={viewerUsername}
              onRequireLogin={onRequireLogin}
              compact={mapSidebar}
              mobileMaxVisible={mapSidebar ? undefined : 2}
            />
          ) : null}
          {description ? (
            <p
              className={[
                'text-body-sm leading-body text-fg',
                mapSidebar
                  ? 'mt-1.5 line-clamp-2'
                  : stackedMobile
                    ? 'mt-2 line-clamp-3 sm:line-clamp-none'
                    : catalog
                      ? 'mt-2 line-clamp-3'
                      : 'mt-2',
              ].join(' ')}
            >
              {description}
            </p>
          ) : null}
        </div>
        {trailing ? (
          <div className="flex shrink-0 flex-col items-end gap-2">{trailing}</div>
        ) : null}
      </div>
    </Root>
  );
}
