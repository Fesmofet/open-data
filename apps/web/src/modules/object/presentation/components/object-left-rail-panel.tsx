'use client';

import { useId, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AddUpdateModal } from '@/modules/object-updates/presentation/components/add-update-modal';
import {
  getUpdateTypesForBlockKind,
  primaryUpdateTypeForBlockKind,
  resolveUpdateCountForBlockKind,
  type ObjectLeftRailBlockKind,
} from '@/modules/object-updates/domain/block-update-type-map';
import { mergeLeftRailBlocksForEditMode } from '@/modules/object-updates/domain/left-rail-edit-blocks';
import { shouldUnoptimizeRemoteImage } from '@/shared/presentation';

import type {
  ObjectLeftRailBlock,
  ObjectRefItem,
  ProjectedGalleryAlbumView,
} from '../../domain/object-page.types';
import type { TagApprovalStatsIndex } from '../../domain/tag-approval-stats';

import { ExternalLinkButton } from './external-link-modal';
import { formatProductSizeDisplay, formatProductWeightDisplay } from '../../infrastructure/object-projected-fields';
import { LeftRailDimensionsIcon } from './left-rail-dimensions-icon';
import { LeftRailWeightScaleIcon } from './left-rail-weight-scale-icon';
import { ObjectCategoryLeftRailSection } from './object-category-left-rail-section';
import { ObjectFeatureListLeftRailSection } from './object-feature-list-left-rail-section';
import { ObjectGalleryCarousel } from './object-gallery-carousel';
import { LeftRailUpdateCountBadge } from './left-rail-update-count-badge';
import { ObjectGeoPreview } from './object-geo-preview';
import { ObjectTagsLeftRailSection } from './object-tags-left-rail-section';
import { ObjectStatusLeftRailSection } from './object-status-left-rail-section';
import { LeftRailTelephonesContent } from './left-rail-telephone-row';
import { ObjectMenuItemsStatic } from './object-menu-items-static';
import { ObjectOptionsSection } from './object-options-section';
import { StarRating } from './star-rating';

export type ObjectLeftRailEditContext = {
  objectId: string;
  viewerUsername: string;
  supportedUpdateTypes: readonly string[];
  /** Existing `tagCategory` names on the object (for `tagCategoryItem` picker). */
  tagCategoryNames: readonly string[];
  /** Existing gallery album names (for `imageGalleryItem` picker). */
  galleryAlbumNames: readonly string[];
  /** On-chain `imageGallery` names (for album ensure before `imageGalleryItem`). */
  onChainGalleryAlbumNames: readonly string[];
  /** Per-type update row counts from object resolve. */
  updateTypeCounts: Record<string, number>;
  /** Opens the updates feed filtered to the given left-rail block. */
  onViewFieldUpdates?: (kind: ObjectLeftRailBlockKind) => void;
};

function countForBlockKind(
  kind: ObjectLeftRailBlockKind,
  counts: Record<string, number>,
  supportedUpdateTypes: readonly string[],
): number {
  return resolveUpdateCountForBlockKind(kind, supportedUpdateTypes, counts);
}

export type ObjectLeftRailPanelProps = {
  blocks: ObjectLeftRailBlock[];
  /** Registry `object_type` key (e.g. `recipe`) for discover links from tag chips. */
  objectTypeKey: string;
  editContext?: ObjectLeftRailEditContext;
  objectId: string;
  /** Active department category feed name (left-rail highlight). */
  activeCategoryName?: string | null;
  /** SSR default nested target — menu link stays on clean `/object/:id`. */
  defaultNestedTargetId?: string | null;
  /** Show Description link when text or gallery preview exists. */
  canOpenDescriptionPage?: boolean;
  objectName?: string;
  /** Photos album for left-rail carousel full-screen viewer. */
  galleryPhotosAlbum?: ProjectedGalleryAlbumView | null;
  onOpenGalleryPhoto?: (album: ProjectedGalleryAlbumView, photoIndex: number) => void;
  supportedUpdateTypes?: readonly string[];
  updateTypeCounts?: Record<string, number>;
  viewerUsername?: string | null;
  onRequireLogin?: () => void;
  tagApprovalStats?: TagApprovalStatsIndex;
};

/** Max characters for description preview card (matches legacy sidebar truncation). */
const OBJECT_LEFT_RAIL_DESCRIPTION_PREVIEW_MAX_CHARS = 250;

function truncateIntroForPreview(text: string): { display: string; isTruncated: boolean } {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { display: '', isTruncated: false };
  }
  if (trimmed.length <= OBJECT_LEFT_RAIL_DESCRIPTION_PREVIEW_MAX_CHARS) {
    return { display: trimmed, isTruncated: false };
  }
  const clipped = trimmed
    .slice(0, OBJECT_LEFT_RAIL_DESCRIPTION_PREVIEW_MAX_CHARS)
    .trimEnd();
  return { display: `${clipped}...`, isTruncated: true };
}

function ChevronAccordion({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 text-muted transition-transform duration-200 ease-out motion-reduce:transition-none ${expanded ? 'rotate-180' : 'rotate-0'}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconAddUpdate({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path
        d="M7 2.5v9M2.5 7h9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LeftRailAddUpdateButton({
  onClick,
  addLabel,
}: {
  onClick: () => void;
  addLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-pill border border-accent bg-accent/10 text-accent hover:bg-accent/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      aria-label={addLabel}
      title={addLabel}
    >
      <IconAddUpdate className="block shrink-0" />
    </button>
  );
}

const LEFT_RAIL_SECTION_CLASS =
  'flex min-w-0 flex-col gap-2 py-card-padding first:pt-0 text-body-sm text-muted';

function LeftRailEditToolbar({
  onAdd,
  addLabel,
  label,
  count,
  onViewUpdates,
}: {
  onAdd?: () => void;
  addLabel: string;
  label?: string;
  /** Existing update rows for this block (edit mode only). */
  count?: number;
  onViewUpdates?: () => void;
}) {
  if (!onAdd) {
    return null;
  }
  return (
    <div className="flex items-start gap-2">
      <LeftRailAddUpdateButton onClick={onAdd} addLabel={addLabel} />
      <div className="min-w-0 flex-1">
        {label ? <p className="font-weight-label text-fg">{label}</p> : null}
        {count != null ? (
          <div className="mt-1">
            <LeftRailUpdateCountBadge
              count={count}
              onClick={onViewUpdates}
              fieldLabel={label}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LeftRailIdentifierSection({
  headingLabel,
  rows,
  onAdd,
  addLabel,
  count,
  onViewUpdates,
}: {
  headingLabel: string;
  rows: { type: string; value: string }[];
  onAdd?: () => void;
  addLabel: string;
  count?: number;
  onViewUpdates?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const hasRows = rows.length > 0;

  return (
    <div className={LEFT_RAIL_SECTION_CLASS}>
      {hasRows || onAdd ? (
        <div className="flex w-full min-w-0 items-start gap-2">
          {onAdd ? <LeftRailAddUpdateButton onClick={onAdd} addLabel={addLabel} /> : null}
          <div className="min-w-0 flex-1 space-y-1">
            {hasRows ? (
              <button
                type="button"
                className="flex w-full min-w-0 items-center justify-between gap-2 rounded-btn text-left text-body-sm font-weight-label text-muted transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                aria-expanded={open}
                aria-controls={contentId}
                onClick={() => setOpen((v) => !v)}
              >
                <span className="min-w-0 truncate text-fg">{headingLabel}</span>
                <ChevronAccordion expanded={open} />
              </button>
            ) : (
              <p className="font-weight-label text-fg">{headingLabel}</p>
            )}
            {onAdd && count != null ? (
              <LeftRailUpdateCountBadge
                count={count}
                onClick={onViewUpdates}
                fieldLabel={headingLabel}
              />
            ) : null}
          </div>
        </div>
      ) : null}
      {open && hasRows ? (
        <div id={contentId} className="space-y-4">
          {rows.map((row, i) => (
            <div key={`${row.type}-${row.value}-${i}`}>
              <p className="text-body-sm font-weight-label uppercase tracking-loose text-fg">
                {row.type}
              </p>
              <p className="mt-1 tabular-nums text-body-sm leading-body text-fg">{row.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LeftRailObjectRefLink({
  objectId,
  name,
  imageUrl,
}: {
  objectId: string;
  name: string;
  imageUrl: string | null;
}) {
  return (
    <Link
      href={`/object/${encodeURIComponent(objectId)}`}
      prefetch={false}
      suppressHydrationWarning
      className="-mx-1 -my-1 flex min-w-0 items-center gap-2.5 rounded-btn p-1 transition-colors hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <div className="relative size-10 shrink-0 overflow-hidden rounded-btn border border-border bg-surface">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="40px"
            unoptimized={shouldUnoptimizeRemoteImage(imageUrl)}
          />
        ) : (
          <div
            className="flex size-full items-center justify-center bg-surface-alt text-micro text-muted"
            aria-hidden
          >
            —
          </div>
        )}
      </div>
      <span className="min-w-0 break-words text-accent">{name}</span>
    </Link>
  );
}

function ObjectRefItemsList({ items }: { items: ObjectRefItem[] }) {
  return (
    <ul className="list-none space-y-1 p-0">
      {items.map((item) => (
        <li key={item.objectId}>
          <LeftRailObjectRefLink
            objectId={item.objectId}
            name={item.name}
            imageUrl={item.imageUrl}
          />
        </li>
      ))}
    </ul>
  );
}

type AddUpdateModalState = {
  candidateUpdateTypes: string[];
  initialUpdateType?: string;
};

export function ObjectLeftRailPanel({
  blocks,
  objectTypeKey,
  editContext,
  objectId,
  activeCategoryName = null,
  defaultNestedTargetId = null,
  canOpenDescriptionPage = false,
  objectName = '',
  galleryPhotosAlbum = null,
  onOpenGalleryPhoto,
  supportedUpdateTypes = [],
  updateTypeCounts,
  viewerUsername,
  onRequireLogin,
  tagApprovalStats,
}: ObjectLeftRailPanelProps) {
  const { t } = useI18n();
  const [addModal, setAddModal] = useState<AddUpdateModalState | null>(null);

  const displayBlocks = useMemo(() => {
    if (!editContext) {
      return blocks.filter((b) => b.kind !== 'name' && b.kind !== 'title');
    }
    return mergeLeftRailBlocksForEditMode(
      blocks,
      editContext.supportedUpdateTypes,
      objectTypeKey,
    );
  }, [blocks, editContext, objectTypeKey]);

  const addLabel = t('object_edit_add_update');

  function openAddModal(kind: ObjectLeftRailBlockKind) {
    if (!editContext) {
      return;
    }
    const candidateUpdateTypes = getUpdateTypesForBlockKind(
      kind,
      editContext.supportedUpdateTypes,
    );
    if (candidateUpdateTypes.length === 0) {
      return;
    }
    const initialUpdateType = primaryUpdateTypeForBlockKind(
      kind,
      editContext.supportedUpdateTypes,
    );
    setAddModal({ candidateUpdateTypes, initialUpdateType });
  }

  function makeOnAdd(kind: ObjectLeftRailBlockKind) {
    if (!editContext) {
      return undefined;
    }
    return () => openAddModal(kind);
  }

  function railBlockCount(kind: ObjectLeftRailBlockKind): number | undefined {
    if (!editContext) {
      return undefined;
    }
    return countForBlockKind(
      kind,
      editContext.updateTypeCounts,
      editContext.supportedUpdateTypes,
    );
  }

  function makeOnViewUpdates(kind: ObjectLeftRailBlockKind) {
    if (!editContext?.onViewFieldUpdates) {
      return undefined;
    }
    return () => editContext.onViewFieldUpdates?.(kind);
  }

  function editToolbarProps(kind: ObjectLeftRailBlockKind, label: string) {
    return {
      onAdd: makeOnAdd(kind),
      addLabel,
      label,
      count: railBlockCount(kind),
      onViewUpdates: makeOnViewUpdates(kind),
    };
  }

  return (
    <div className="flex min-w-0 flex-col divide-y divide-border">
      {editContext && addModal ? (
        <AddUpdateModal
          open
          mode="leftRail"
          onClose={() => setAddModal(null)}
          objectId={editContext.objectId}
          viewerUsername={editContext.viewerUsername}
          candidateUpdateTypes={addModal.candidateUpdateTypes}
          initialUpdateType={addModal.initialUpdateType}
          tagCategoryNames={editContext.tagCategoryNames}
          galleryAlbumNames={editContext.galleryAlbumNames}
          onChainGalleryAlbumNames={editContext.onChainGalleryAlbumNames}
          updateTypeCounts={editContext.updateTypeCounts}
        />
      ) : null}
      {displayBlocks.map((block, index) => {
        switch (block.kind) {
          case 'menuItems':
            return (
              <div key={`menu-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('menuItems', block.headingLabel)} />
                <ObjectMenuItemsStatic
                  items={block.items}
                  hostObjectId={objectId}
                  defaultNestedTargetId={defaultNestedTargetId}
                />
              </div>
            );
          case 'name':
            return (
              <div key={`name-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('name', block.headingLabel)} />
                {block.text.trim() ? (
                  <p className="font-weight-label text-fg">{block.text}</p>
                ) : null}
              </div>
            );
          case 'title':
            return (
              <div key={`title-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('title', block.headingLabel)} />
                {block.text.trim() ? <p className="text-fg">{block.text}</p> : null}
              </div>
            );
          case 'image':
            return (
              <div key={`image-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('image', block.headingLabel)} />
              </div>
            );
          case 'imageBackground':
            return (
              <div key={`imageBackground-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('imageBackground', block.headingLabel)} />
              </div>
            );
          case 'parent':
            return (
              <div key={`parent-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('parent', block.headingLabel)} />
                {block.objectId.trim() ? (
                  <LeftRailObjectRefLink
                    objectId={block.objectId}
                    name={block.name}
                    imageUrl={block.imageUrl}
                  />
                ) : null}
              </div>
            );
          case 'description': {
            const intro = truncateIntroForPreview(block.text);
            // Show button when: text is truncated (>250 chars), OR short text but has gallery photos,
            // OR no text but description page exists (gallery only).
            // Matches legacy: show when description > 300 chars OR (description ≤ 300 AND galleryItem.length > 1).
            const showDescriptionBtn =
              intro.isTruncated || (canOpenDescriptionPage && !intro.display) || (intro.display && canOpenDescriptionPage && galleryPhotosAlbum != null && (galleryPhotosAlbum.items.length > 1));
            return (
              <div key={`desc-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('description', block.headingLabel)} />
                {intro.display ? (
                  <p
                    className="leading-editorial text-fg"
                    title={intro.isTruncated ? block.text.trim() : undefined}
                  >
                    {intro.display}
                  </p>
                ) : null}
                {showDescriptionBtn ? (
                  <Link
                    href={`/object/${encodeURIComponent(objectId)}/description`}
                    className="inline-block rounded-btn border border-border px-3 py-2 text-body-sm font-weight-label text-fg hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    suppressHydrationWarning
                  >
                    {t('object_detail_description_button')}
                  </Link>
                ) : null}
              </div>
            );
          }
          case 'button': {
            return (
              <div key={`btn-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('button', block.headingLabel)} />
                {block.items.length > 0 ? (
                  <ul className="list-none space-y-2 p-0">
                    {block.items.map((item, itemIndex) => (
                      <li key={`${item.title}-${itemIndex}`}>
                        <ExternalLinkButton
                          href={item.href}
                          className="block w-full rounded-btn bg-accent px-4 py-2 text-center text-body-sm font-weight-label text-accent-fg transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                        >
                          {item.title}
                        </ExternalLinkButton>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          }
          case 'rating': {
            return (
              <div key={`rating-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('rating', block.headingLabel)} />
                <ul className="list-none space-y-2 p-0">
                  {block.aspects.map((aspect, aspectIndex) => (
                    <li key={`${aspect.update_id}-${aspectIndex}`} className="min-w-0">
                      <p
                        className="truncate font-weight-label leading-body text-fg"
                        title={aspect.dimension}
                      >
                        {aspect.dimension}
                      </p>
                      <div className="mt-1">
                        <StarRating
                          averageRating01To5={aspect.averageRating01To5}
                          userRating01To5={aspect.viewerRating01To5}
                          totalVoters={aspect.totalVoters}
                          dimension={aspect.dimension}
                          updateId={aspect.update_id}
                          objectId={objectId}
                          viewerUsername={viewerUsername}
                          onRequireLogin={onRequireLogin}
                          size="md"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
          case 'tags':
            return (
              <div key={`tags-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <ObjectTagsLeftRailSection
                  headingLabel={block.headingLabel}
                  sections={block.sections}
                  objectTypeKey={objectTypeKey}
                  objectId={objectId}
                  isEditMode={Boolean(editContext)}
                  viewerUsername={viewerUsername}
                  tagCategoryNames={editContext?.tagCategoryNames ?? []}
                  count={editContext ? railBlockCount('tags') : undefined}
                  onViewUpdates={editContext ? makeOnViewUpdates('tags') : undefined}
                  addLabel={addLabel}
                  tagApprovalStats={tagApprovalStats}
                  onRequireLogin={onRequireLogin}
                />
              </div>
            );
          case 'gallery':
            return (
              <div key={`gallery-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('gallery', block.headingLabel)} />
                <ObjectGalleryCarousel
                  photos={block.photos}
                  onPhotoClick={
                    galleryPhotosAlbum && onOpenGalleryPhoto
                      ? (index) => {
                          const url = block.photos[index]?.url;
                          const albumIndex =
                            url != null
                              ? galleryPhotosAlbum.items.findIndex((item) => item.url === url)
                              : -1;
                          onOpenGalleryPhoto(
                            galleryPhotosAlbum,
                            albumIndex >= 0 ? albumIndex : index,
                          );
                        }
                      : undefined
                  }
                />
              </div>
            );
          case 'price':
            return (
              <div key={`price-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('price', block.headingLabel)} />
                <div className="flex items-center gap-1">
                  <span className="text-muted" aria-hidden>
                    $
                  </span>
                  <span className="font-weight-strong tabular-nums text-fg">{block.text}</span>
                </div>
              </div>
            );
          case 'options':
            return (
              <div key={`options-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar
                  {...editToolbarProps('options', t('object_field_options'))}
                />
                {block.categories.length > 0 ? (
                  <ObjectOptionsSection
                    key={block.currentObjectId || objectId}
                    currentObjectId={block.currentObjectId || objectId}
                    categories={block.categories}
                  />
                ) : null}
              </div>
            );
          case 'workHours':
            return (
              <div key={`hours-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('workHours', block.headingLabel)} />
                <ul className="space-y-1">
                  {block.lines.map((line, lineIndex) => (
                    <li key={`${index}-${lineIndex}`}>{line}</li>
                  ))}
                </ul>
              </div>
            );
          case 'address':
            return (
              <div key={`addr-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('address', block.headingLabel)} />
                <p className="whitespace-pre-line leading-editorial">{block.text}</p>
              </div>
            );
          case 'geo': {
            const hasCoords =
              block.latitude != null &&
              block.longitude != null &&
              Number.isFinite(block.latitude) &&
              Number.isFinite(block.longitude);
            const geoLabel = objectName.trim() || block.headingLabel;
            return (
              <div key={`geo-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('geo', block.headingLabel)} />
                {hasCoords ? (
                  <div className="overflow-hidden rounded-btn">
                    <ObjectGeoPreview
                      latitude={block.latitude!}
                      longitude={block.longitude!}
                      label={geoLabel}
                    />
                  </div>
                ) : null}
              </div>
            );
          }
          case 'websites':
            return (
              <div key={`web-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('websites', block.headingLabel)} />
                <ul className="space-y-2">
                  {block.entries.map((entry) => (
                    <li key={`${entry.link}-${entry.title}`}>
                      <ExternalLinkButton
                        href={entry.link}
                        className="flex w-full items-start gap-2 rounded-btn text-left transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        <img
                          src="/images/icons/link-icon.svg"
                          alt=""
                          width={16}
                          height={16}
                          className="mt-0.5 shrink-0 opacity-80"
                        />
                        <span className="break-all text-accent">{entry.title}</span>
                      </ExternalLinkButton>
                    </li>
                  ))}
                </ul>
              </div>
            );
          case 'productWeight':
            return (
              <div key={`product-weight-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar
                  {...editToolbarProps('productWeight', block.headingLabel)}
                />
                {block.unit ? (
                  <div className="flex items-center gap-2 text-body-sm text-fg">
                    <LeftRailWeightScaleIcon />
                    <span className="tabular-nums">
                      {formatProductWeightDisplay({
                        value: block.value,
                        unit: block.unit,
                      })}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          case 'size':
            return (
              <div key={`size-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('size', block.headingLabel)} />
                {block.unit ? (
                  <div className="flex items-center gap-2 text-body-sm text-fg">
                    <LeftRailDimensionsIcon />
                    <span className="tabular-nums">
                      {formatProductSizeDisplay({
                        length: block.length,
                        width: block.width,
                        depth: block.depth,
                        unit: block.unit,
                      })}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          case 'phones':
            return (
              <div key={`phones-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('phones', block.headingLabel)} />
                <LeftRailTelephonesContent entries={block.entries} />
              </div>
            );
          case 'email':
            return (
              <div key={`email-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('email', block.headingLabel)} />
                <a
                  href={`mailto:${block.address}`}
                  className="block break-all text-accent hover:underline focus-visible:rounded-btn focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {block.address}
                </a>
              </div>
            );
          case 'walletAddress':
            return (
              <div key={`wallet-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('walletAddress', block.headingLabel)} />
                <ul className="list-none space-y-2 p-0">
                  {block.items.map((row, rowIndex) => (
                    <li key={`${row.lineText}-${rowIndex}`} className="flex items-center gap-2">
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-btn border border-border/80 bg-external-brand-well backdrop-blur-sm shadow-inset"
                        aria-hidden
                      >
                        <img
                          src={row.iconSrc}
                          alt=""
                          width={22}
                          height={22}
                          className="size-[22px] object-contain"
                        />
                      </div>
                      <span className="min-w-0 flex-1 break-words leading-body text-accent">
                        {row.lineText}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          case 'identifier':
            return (
              <LeftRailIdentifierSection
                key={`identifier-${index}`}
                headingLabel={block.headingLabel}
                rows={block.rows}
                onAdd={makeOnAdd('identifier')}
                addLabel={addLabel}
                count={railBlockCount('identifier')}
                onViewUpdates={makeOnViewUpdates('identifier')}
              />
            );
          case 'link':
            return (
              <div key={`link-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps('link', block.headingLabel)} />
                <ul className="list-none space-y-2 p-0">
                  {block.items.map((row, rowIndex) => (
                    <li key={`${row.label}-${rowIndex}`}>
                      <ExternalLinkButton
                        href={row.href}
                        className="flex w-full items-center gap-2 rounded-btn text-left transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        <div
                          className="flex size-9 shrink-0 items-center justify-center rounded-btn border border-border/80 bg-external-brand-well backdrop-blur-sm shadow-inset"
                          aria-hidden
                        >
                          <img
                            src={row.iconSrc}
                            alt=""
                            width={22}
                            height={22}
                            className="size-[22px] object-contain"
                          />
                        </div>
                        <span className="text-accent">{row.label}</span>
                      </ExternalLinkButton>
                    </li>
                  ))}
                </ul>
              </div>
            );
          case 'brand':
          case 'manufacturer':
          case 'merchant':
          case 'author':
          case 'publisher':
            return (
              <div key={`${block.kind}-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps(block.kind, block.headingLabel)} />
                {block.items.length > 0 ? (
                  <ObjectRefItemsList items={block.items} />
                ) : null}
              </div>
            );
          case 'featureList':
            return (
              <div key={`featureList-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <ObjectFeatureListLeftRailSection
                  headingLabel={block.headingLabel}
                  items={block.items}
                  editToolbar={
                    editContext ? (
                      <LeftRailEditToolbar {...editToolbarProps('featureList', block.headingLabel)} />
                    ) : undefined
                  }
                />
              </div>
            );
          case 'status':
            return (
              <div key={`status-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <ObjectStatusLeftRailSection
                  headingLabel={block.headingLabel}
                  objectId={objectId}
                  viewerUsername={viewerUsername}
                  count={railBlockCount('status')}
                  onViewUpdates={makeOnViewUpdates('status')}
                  onAdd={makeOnAdd('status')}
                  addLabel={addLabel}
                  onRequireLogin={onRequireLogin}
                />
              </div>
            );
          case 'compareAtPrice':
          case 'saleEvent':
          case 'calories':
          case 'cookTime':
          case 'ingredients':
          case 'nutrition':
          case 'datePublished':
          case 'inLanguage':
          case 'typicalAgeRange':
            return (
              <div key={`${block.kind}-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <LeftRailEditToolbar {...editToolbarProps(block.kind, block.headingLabel)} />
              </div>
            );
          case 'category':
            return (
              <div key={`category-${index}`} className={LEFT_RAIL_SECTION_CLASS}>
                <ObjectCategoryLeftRailSection
                  objectId={objectId}
                  headingLabel={block.headingLabel}
                  names={block.names}
                  activeCategoryName={activeCategoryName}
                  editToolbar={
                    editContext ? (
                      <LeftRailEditToolbar {...editToolbarProps('category', block.headingLabel)} />
                    ) : undefined
                  }
                />
              </div>
            );
          default: {
            const _never: never = block;
            return _never;
          }
        }
      })}
    </div>
  );
}
