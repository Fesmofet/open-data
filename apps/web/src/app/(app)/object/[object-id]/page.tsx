import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { OBJECT_TYPE_REGISTRY } from '@opden-data-layer/core/object-type-registry';
import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';
import {
  RELATED_ALBUM_NAME,
  isObjectTypeEligibleForRelatedAlbum,
} from '@opden-data-layer/core/post-related-images';

import {
  ObjectPageUpdatesFeedSkeleton,
} from '@/modules/object/presentation/components/object-page-loading-skeleton';
import {
  resolveNestedObjectContent,
  resolveNestedObjectPath,
} from '@/modules/object/infrastructure/resolve-nested-object-content.server';
import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
import { getRequestUser } from '@/shared/infrastructure/auth/get-request-user.server';
import { buildObjectMetadata } from '@/seo';

import { getObjectAuthorityPageQuery } from '@/modules/object/application/queries/get-object-authority-page.query';
import { getObjectFollowersPageQuery } from '@/modules/object/application/queries/get-object-followers-page.query';
import { getObjectExpertsPageQuery } from '@/modules/object/application/queries/get-object-experts-page.query';
import {
  fetchObjectRefList,
  REF_LIST_PAGE_SIZE,
} from '@/modules/object/infrastructure/object-ref-list.client';
import {
  fetchObjectFieldReferencesByType,
} from '@/modules/object/infrastructure/object-field-references.client';
import { fetchCategoryObjects } from '@/modules/object/infrastructure/category-objects.client';
import {
  fetchObjectRelatedAlbumPage,
  fetchObjectRelatedAlbumPreview,
} from '@/modules/object/infrastructure/fetch-object-related-album.server';
import type { ObjectPageViewModel } from '@/modules/object';
import {
  parseSubscriptionSortParam,
  USER_SOCIAL_PAGE_SIZE,
} from '@/modules/user-social';

import { loadObjectPageModel } from './object-page-model.server';
import { ObjectPageUpdatesFeedSection } from './object-page-updates-feed-section.server';
import { ObjectPageUpdateDetailSection } from './object-page-update-detail-section.server';
import { ObjectPagePostsFeedSection } from './object-page-posts-feed-section.server';
import { ObjectThreadsFeedList } from './object-threads-feed-list';
import { FeedPostsLoadingSkeleton } from '@/modules/feed';
import {
  isAllowedFieldReferenceObjectType,
  isFieldReferenceSourceType,
} from '@/modules/object/domain/field-reference-rules';
import {
  OBJECT_PAGE_FIELD_REFERENCES_PATH_SEGMENT,
} from '@/modules/object/domain/object-page-url.constants';
import {
  firstSearchParam,
  OBJECT_PAGE_DESCRIPTION_SEGMENT,
  OBJECT_PAGE_GALLERY_ALBUM_PARAM,
  OBJECT_PAGE_CATEGORY_NAME_PARAM,
  OBJECT_PAGE_FIELD_REFERENCE_TYPE_PARAM,
  OBJECT_PAGE_PRIMARY_TAB_PARAM,
  OBJECT_PAGE_UPDATE_ID_PARAM,
  parseAuthoritySubTypeParam,
  parseViewPathParam,
  resolveDefaultPrimarySegmentFromLanding,
  sanitizeNestedStack,
} from './object-page-search';
import { ObjectPageTabPane } from './object-page-tab-pane';
import { ObjectPageInvalidPathFix } from './object-page-invalid-path-fix';

const REF_LIST_PRIMARY_SEGMENTS = ['related', 'similar', 'add-on'] as const;
const CATEGORY_PRIMARY_SEGMENT = 'category';
const FIELD_REFERENCES_PRIMARY_SEGMENT = OBJECT_PAGE_FIELD_REFERENCES_PATH_SEGMENT;

function parseUpdateIdParam(
  sp: Record<string, string | string[] | undefined>,
): string | null {
  const raw = firstSearchParam(sp, OBJECT_PAGE_UPDATE_ID_PARAM)?.trim();
  if (!raw) {
    return null;
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function parseCategoryNameParam(
  sp: Record<string, string | string[] | undefined>,
): string | null {
  const raw = firstSearchParam(sp, OBJECT_PAGE_CATEGORY_NAME_PARAM)?.trim();
  if (!raw) {
    return null;
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function parseFieldReferenceTypeParam(
  sp: Record<string, string | string[] | undefined>,
): string | null {
  const raw = firstSearchParam(sp, OBJECT_PAGE_FIELD_REFERENCE_TYPE_PARAM)?.trim();
  if (!raw) {
    return null;
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function objectTypeSupportsRefList(
  objectTypeKey: string,
  updateType: string,
): boolean {
  const registryEntry =
    OBJECT_TYPE_REGISTRY[objectTypeKey as keyof typeof OBJECT_TYPE_REGISTRY];
  return registryEntry?.supported_updates.includes(updateType) ?? false;
}

function resolveInitialPrimarySegment(
  model: ObjectPageViewModel,
  sp: Record<string, string | string[] | undefined>,
  pathIds: string[],
): string {
  const allowed = new Set(model.primaryTabs.map((t) => t.segment));
  const refListSegments = new Set<string>(REF_LIST_PRIMARY_SEGMENTS);
  const tabRaw = firstSearchParam(sp, OBJECT_PAGE_PRIMARY_TAB_PARAM)?.trim();

  if (tabRaw === OBJECT_PAGE_DESCRIPTION_SEGMENT) {
    return OBJECT_PAGE_DESCRIPTION_SEGMENT;
  }
  if (tabRaw === CATEGORY_PRIMARY_SEGMENT && parseCategoryNameParam(sp)) {
    return CATEGORY_PRIMARY_SEGMENT;
  }
  const fieldReferenceType = parseFieldReferenceTypeParam(sp);
  if (
    tabRaw === FIELD_REFERENCES_PRIMARY_SEGMENT &&
    fieldReferenceType &&
    isFieldReferenceSourceType(model.objectTypeKey) &&
    isAllowedFieldReferenceObjectType(model.objectTypeKey, fieldReferenceType)
  ) {
    return FIELD_REFERENCES_PRIMARY_SEGMENT;
  }
  if (tabRaw && (allowed.has(tabRaw) || refListSegments.has(tabRaw))) {
    return tabRaw;
  }
  if (!tabRaw && pathIds.length === 0) {
    return resolveDefaultPrimarySegmentFromLanding(
      model.defaultLanding,
      model.primaryTabs.map((tab) => tab.segment),
    );
  }
  return '';
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ 'object-id': string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { 'object-id': rawId } = await params;
  const objectId = decodeURIComponent(rawId);
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  const sp = await searchParams;

  const model = await loadObjectPageModel(objectId, locale, null);
  if (!model) {
    return { title: objectId };
  }

  const baseTitle = model.seo?.title ?? model.title;
  const objectLabel =
    typeof messages.object === 'string' ? messages.object : 'object';

  const tab = firstSearchParam(sp, OBJECT_PAGE_PRIMARY_TAB_PARAM)?.trim();
  let title = `${baseTitle} · ${objectLabel}`;
  if (tab === 'updates') {
    const updatesLabel =
      typeof messages.object_updates_title === 'string'
        ? messages.object_updates_title
        : 'Updates';
    title = `${baseTitle} · ${updatesLabel}`;
  } else if (tab === 'followers') {
    const followersLabel =
      typeof messages.followers === 'string' ? messages.followers : 'Followers';
    title = `${baseTitle} · ${followersLabel}`;
  } else if (tab === 'authority') {
    const authorityLabel =
      typeof messages.authority === 'string' ? messages.authority : 'Authority';
    title = `${baseTitle} · ${authorityLabel}`;
  } else if (tab === OBJECT_PAGE_DESCRIPTION_SEGMENT) {
    const descriptionLabel =
      typeof messages.object_detail_description_button === 'string'
        ? messages.object_detail_description_button
        : 'Description';
    title = `${baseTitle} · ${descriptionLabel}`;
  } else if (tab === 'gallery') {
    const galleryLabel =
      typeof messages.gallery === 'string' ? messages.gallery : 'Gallery';
    title = `${baseTitle} · ${galleryLabel}`;
  } else if (tab === 'experts') {
    const expertsLabel =
      typeof messages.experts === 'string' ? messages.experts : 'Experts';
    title = `${baseTitle} · ${expertsLabel}`;
  } else if (tab === 'related') {
    const relatedLabel =
      typeof messages.object_right_related === 'string'
        ? messages.object_right_related
        : 'Related';
    title = `${baseTitle} · ${relatedLabel}`;
  } else if (tab === 'similar') {
    const similarLabel =
      typeof messages.object_right_similar === 'string'
        ? messages.object_right_similar
        : 'Similar';
    title = `${baseTitle} · ${similarLabel}`;
  } else if (tab === 'add-on') {
    const addOnLabel =
      typeof messages.object_right_add_on === 'string'
        ? messages.object_right_add_on
        : 'Add-On';
    title = `${baseTitle} · ${addOnLabel}`;
  } else if (tab === FIELD_REFERENCES_PRIMARY_SEGMENT) {
    const referenceType = firstSearchParam(sp, OBJECT_PAGE_FIELD_REFERENCE_TYPE_PARAM)?.trim();
    let decodedType = referenceType;
    if (referenceType) {
      try {
        decodedType = decodeURIComponent(referenceType);
      } catch {
        decodedType = referenceType;
      }
    }
    if (decodedType === 'book') {
      const booksLabel =
        typeof messages.books === 'string' ? messages.books : 'Books';
      title = `${baseTitle} · ${booksLabel}`;
    } else if (decodedType === 'product') {
      const productsLabel =
        typeof messages.products === 'string' ? messages.products : 'Products';
      title = `${baseTitle} · ${productsLabel}`;
    } else {
      const referencesLabel =
        typeof messages.references === 'string' ? messages.references : 'References';
      title = `${baseTitle} · ${referencesLabel}`;
    }
  } else if (tab === CATEGORY_PRIMARY_SEGMENT) {
    const categoryName = parseCategoryNameParam(sp);
    if (categoryName) {
      title = `${baseTitle} · ${categoryName}`;
    }
  }

  return buildObjectMetadata({
    objectId: model.objectId,
    title,
    description: model.seo?.description ?? model.tagline,
    canonicalUrl: model.seo?.canonical_url ?? null,
    avatarUrl: model.avatarUrl,
    coverImageUrl: model.coverImageUrl,
    objectTypeKey: model.objectTypeKey,
    jsonLd: model.seo?.json_ld ?? null,
    keywords: model.seo?.keywords ?? null,
  });
}

export default async function ObjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ 'object-id': string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { 'object-id': rawId } = await params;
  const objectId = decodeURIComponent(rawId);
  const locale = await getRequestLocale();
  const sp = await searchParams;

  const user = await getRequestUser();
  const viewerUsername = user?.username ?? null;

  const model = await loadObjectPageModel(objectId, locale, viewerUsername);

  if (!model) {
    notFound();
  }

  const pathIds = parseViewPathParam(sp);
  const initialPrimarySegment = resolveInitialPrimarySegment(model, sp, pathIds);
  const activeCategoryName =
    initialPrimarySegment === CATEGORY_PRIMARY_SEGMENT ? parseCategoryNameParam(sp) : null;
  const activeFieldReferenceType =
    initialPrimarySegment === FIELD_REFERENCES_PRIMARY_SEGMENT
      ? parseFieldReferenceTypeParam(sp)
      : null;
  const supportsFieldReferences = isFieldReferenceSourceType(model.objectTypeKey);

  const supportsRelated = objectTypeSupportsRefList(
    model.objectTypeKey,
    UPDATE_TYPES.IS_RELATED_TO,
  );
  const supportsSimilar = objectTypeSupportsRefList(
    model.objectTypeKey,
    UPDATE_TYPES.IS_SIMILAR_TO,
  );
  const supportsAddOn = objectTypeSupportsRefList(
    model.objectTypeKey,
    UPDATE_TYPES.ADD_ON,
  );

  const followersSort = parseSubscriptionSortParam(sp.sort);
  const authoritySubType = parseAuthoritySubTypeParam(sp);
  const authoritySort = parseSubscriptionSortParam(sp.sort);
  const nestedResolveInit = { locale, viewer: viewerUsername };
  const refFetchInit = { locale, viewer: viewerUsername };

  const [
    embeddedFollowersPage,
    embeddedExpertsPage,
    embeddedAuthorityPage,
    embeddedRelatedPage,
    embeddedSimilarPage,
    embeddedAddOnPage,
    embeddedCategoryPage,
    embeddedFieldReferencesPage,
    initialNestedStackRaw,
    defaultNestedContent,
  ] = await Promise.all([
    initialPrimarySegment === 'followers'
      ? getObjectFollowersPageQuery(
          objectId,
          { sort: followersSort, skip: 0, limit: USER_SOCIAL_PAGE_SIZE },
          viewerUsername,
        )
      : Promise.resolve(null),
    initialPrimarySegment === 'experts'
      ? getObjectExpertsPageQuery(
          objectId,
          { skip: 0, limit: USER_SOCIAL_PAGE_SIZE },
          viewerUsername,
        )
      : Promise.resolve(null),
    initialPrimarySegment === 'authority'
      ? getObjectAuthorityPageQuery(
          objectId,
          {
            authorityType: authoritySubType,
            sort: authoritySort,
            skip: 0,
            limit: USER_SOCIAL_PAGE_SIZE,
          },
          viewerUsername,
        )
      : Promise.resolve(null),
    initialPrimarySegment === 'related' && supportsRelated
      ? fetchObjectRefList(
          objectId,
          'related',
          { limit: REF_LIST_PAGE_SIZE },
          refFetchInit,
        )
      : Promise.resolve(null),
    initialPrimarySegment === 'similar' && supportsSimilar
      ? fetchObjectRefList(
          objectId,
          'similar',
          { limit: REF_LIST_PAGE_SIZE },
          refFetchInit,
        )
      : Promise.resolve(null),
    initialPrimarySegment === 'add-on' && supportsAddOn
      ? fetchObjectRefList(
          objectId,
          'add-on',
          { limit: REF_LIST_PAGE_SIZE },
          refFetchInit,
        )
      : Promise.resolve(null),
    initialPrimarySegment === CATEGORY_PRIMARY_SEGMENT && activeCategoryName
      ? fetchCategoryObjects(
          {
            name: activeCategoryName,
            limit: REF_LIST_PAGE_SIZE,
            excludeObjectId: objectId,
          },
          refFetchInit,
        )
      : Promise.resolve(null),
    initialPrimarySegment === FIELD_REFERENCES_PRIMARY_SEGMENT &&
    supportsFieldReferences &&
    activeFieldReferenceType &&
    isAllowedFieldReferenceObjectType(model.objectTypeKey, activeFieldReferenceType)
      ? fetchObjectFieldReferencesByType(
          objectId,
          activeFieldReferenceType,
          { limit: REF_LIST_PAGE_SIZE },
          refFetchInit,
        )
      : Promise.resolve(null),
    pathIds.length > 0
      ? resolveNestedObjectPath(pathIds, nestedResolveInit)
      : Promise.resolve([]),
    model.defaultLanding.kind === 'nestedInHost'
      ? resolveNestedObjectContent(model.defaultLanding.targetObjectId, nestedResolveInit)
      : Promise.resolve(null),
  ]);

  const initialNestedStack = sanitizeNestedStack(pathIds, initialNestedStackRaw);

  const galleryAlbumRaw = firstSearchParam(sp, OBJECT_PAGE_GALLERY_ALBUM_PARAM)?.trim();
  const initialGalleryAlbum = galleryAlbumRaw
    ? (() => {
        try {
          return decodeURIComponent(galleryAlbumRaw);
        } catch {
          return galleryAlbumRaw;
        }
      })()
    : null;

  const needsRelatedAlbumData = isObjectTypeEligibleForRelatedAlbum(model.objectTypeKey);
  const [relatedAlbumPreview, relatedAlbumInitialPage] = await Promise.all([
    needsRelatedAlbumData && initialPrimarySegment === 'gallery'
      ? fetchObjectRelatedAlbumPreview(objectId, { locale })
      : Promise.resolve(null),
    needsRelatedAlbumData && initialGalleryAlbum === RELATED_ALBUM_NAME
      ? fetchObjectRelatedAlbumPage(objectId, { locale, limit: 20 })
      : Promise.resolve(null),
  ]);

  const invalidPathRequested = pathIds.length > 0 && initialNestedStack.length === 0;

  const updateIdParam = parseUpdateIdParam(sp);

  const updatesFeedSlot =
    initialPrimarySegment === 'updates' ? (
      updateIdParam ? (
        <Suspense key="object-update-detail" fallback={<ObjectPageUpdatesFeedSkeleton />}>
          <ObjectPageUpdateDetailSection
            objectId={objectId}
            updateId={updateIdParam}
            locale={locale}
            viewerUsername={viewerUsername}
          />
        </Suspense>
      ) : (
        <Suspense key="object-updates-feed" fallback={<ObjectPageUpdatesFeedSkeleton />}>
          <ObjectPageUpdatesFeedSection
            objectId={objectId}
            model={model}
            searchParams={sp}
            locale={locale}
            viewerUsername={viewerUsername}
          />
        </Suspense>
      )
    ) : null;

  const postsFeedSlot =
    initialPrimarySegment === 'reviews' ? (
      <Suspense key="object-posts-feed" fallback={<FeedPostsLoadingSkeleton />}>
        <ObjectPagePostsFeedSection
          objectId={objectId}
          viewerUsername={viewerUsername}
        />
      </Suspense>
    ) : null;

  const threadsFeedSlot = (
    <ObjectThreadsFeedList
      key="object-threads-feed"
      objectId={objectId}
      currentUsername={viewerUsername}
    />
  );

  return (
    <>
      {invalidPathRequested ? (
        <ObjectPageInvalidPathFix objectId={objectId} />
      ) : null}
      <ObjectPageTabPane
        model={model}
        embeddedFollowersPage={embeddedFollowersPage}
        embeddedExpertsPage={embeddedExpertsPage}
        followersSort={followersSort}
        embeddedAuthorityPage={embeddedAuthorityPage}
        authoritySubType={authoritySubType}
        authoritySort={authoritySort}
        embeddedRelatedPage={embeddedRelatedPage}
        embeddedSimilarPage={embeddedSimilarPage}
        embeddedAddOnPage={embeddedAddOnPage}
        embeddedCategoryPage={embeddedCategoryPage}
        embeddedFieldReferencesPage={embeddedFieldReferencesPage}
        activeCategoryName={activeCategoryName}
        activeFieldReferenceType={activeFieldReferenceType}
        viewerUsername={viewerUsername}
        relatedAlbumPreview={relatedAlbumPreview}
        relatedAlbumInitialPage={relatedAlbumInitialPage}
        initialNestedStack={initialNestedStack}
        defaultNestedContent={defaultNestedContent}
        updatesFeedSlot={updatesFeedSlot}
        postsFeedSlot={postsFeedSlot}
        threadsFeedSlot={threadsFeedSlot}
      />
    </>
  );
}
