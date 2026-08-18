'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { OBJECT_TYPE_REGISTRY } from '@opden-data-layer/core/object-type-registry';
import type {
  AuthoritySubType,
  ObjectNestedViewResolved,
  ObjectPageViewModel,
} from '@/modules/object/domain/object-page.types';
import type { ProjectedGalleryAlbumView } from '@/modules/object/domain/object-page.types';
import type { RelatedAlbumListView, RelatedAlbumPreviewView } from '@/modules/object/domain/related-album.types';
import {
  ObjectAuthoritySubNav,
  ObjectPrimaryContent,
  ObjectRefListFeed,
} from '@/modules/object';
import { ObjectCategoryObjectsFeed } from '@/modules/object/presentation/components/object-category-objects-feed';
import { ObjectFieldReferencesListFeed } from '@/modules/object/presentation/components/object-field-references-list-feed';
import type { ObjectRefListPageView } from '@/modules/object/infrastructure/object-ref-list.client';
import type { ObjectFieldReferencesPageView } from '@/modules/object/infrastructure/object-field-references.client';
import type { CategoryObjectsPageView } from '@/modules/object/infrastructure/category-objects.client';
import { AuthorityActionButton } from '@/modules/object/presentation/components/authority-action-button';
import type {
  PaginatedUserFollowListView,
  UserSubscriptionSort,
} from '@/modules/user-social/application/dto/user-social.dto';
import type { PaginatedObjectExpertListView } from '@/modules/object/domain/types/object-experts';
import { ObjectExpertsAccountList } from '@/modules/object/presentation/components/object-experts-account-list';
import { UserSocialAccountList } from '@/modules/user-social/presentation/components/user-social-account-list';
import { useLoginModal } from '@/modules/auth';

import { loadMoreObjectAuthorityAction } from './authority/object-authority.actions';
import { loadMoreObjectExpertsAction } from './experts/object-experts.actions';
import { loadMoreObjectFollowersAction } from './followers/object-followers.actions';
import { loadMoreObjectRefListAction } from './related/load-more-ref-list.actions';
import { loadMoreObjectFieldReferencesAction } from './field-references/load-more-field-references.actions';
import { loadMoreCategoryObjectsAction } from './category/load-more-category-objects.actions';
import { revalidateObjectAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';
import { useObjectPageShell } from './object-page-shell-context';
import { resolveCategoryNameForObjectPage, resolveFieldReferenceTypeForObjectPage } from './object-page-search';
import {
  isAllowedFieldReferenceObjectType,
  isFieldReferenceSourceType,
} from '@/modules/object/domain/field-reference-rules';
import { resolveHostPageContent } from '@/modules/object/domain/resolve-host-page-content';
import { resolveGalleryPhotosAlbum } from '@/modules/object/domain/resolve-gallery-photos-album';

export type ObjectPageTabPaneProps = {
  model: ObjectPageViewModel;
  embeddedFollowersPage: PaginatedUserFollowListView | null;
  embeddedExpertsPage: PaginatedObjectExpertListView | null;
  followersSort: UserSubscriptionSort;
  embeddedAuthorityPage: PaginatedUserFollowListView | null;
  authoritySubType: AuthoritySubType;
  authoritySort: UserSubscriptionSort;
  embeddedRelatedPage: ObjectRefListPageView | null;
  embeddedSimilarPage: ObjectRefListPageView | null;
  embeddedAddOnPage: ObjectRefListPageView | null;
  embeddedCategoryPage: CategoryObjectsPageView | null;
  embeddedFieldReferencesPage: ObjectFieldReferencesPageView | null;
  activeCategoryName: string | null;
  activeFieldReferenceType: string | null;
  viewerUsername: string | null;
  relatedAlbumPreview?: RelatedAlbumPreviewView | null;
  relatedAlbumInitialPage?: RelatedAlbumListView | null;
  initialNestedStack: ObjectNestedViewResolved[];
  defaultNestedContent: ObjectNestedViewResolved | null;
  updatesFeedSlot?: ReactNode;
  postsFeedSlot?: ReactNode;
  threadsFeedSlot?: ReactNode;
};

export function ObjectPageTabPane({
  model,
  embeddedFollowersPage,
  embeddedExpertsPage,
  followersSort,
  embeddedAuthorityPage,
  authoritySubType,
  authoritySort,
  embeddedRelatedPage,
  embeddedSimilarPage,
  embeddedAddOnPage,
  embeddedCategoryPage,
  embeddedFieldReferencesPage,
  activeCategoryName,
  activeFieldReferenceType,
  viewerUsername,
  relatedAlbumPreview = null,
  relatedAlbumInitialPage = null,
  initialNestedStack,
  defaultNestedContent,
  updatesFeedSlot = null,
  postsFeedSlot = null,
  threadsFeedSlot = null,
}: ObjectPageTabPaneProps) {
  const {
    activePrimarySegment,
    activeGalleryAlbum,
    onAuthoritySubSelect,
    onOpenGalleryAlbum,
    onBackToGalleryAlbums,
    onOpenGalleryPhoto,
  } = useObjectPageShell();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryNameFromUrl = useMemo(
    () => resolveCategoryNameForObjectPage(model.objectId, pathname, searchParams),
    [model.objectId, pathname, searchParams],
  );
  const effectiveCategoryName = activeCategoryName ?? categoryNameFromUrl;
  const fieldReferenceTypeFromUrl = useMemo(
    () => resolveFieldReferenceTypeForObjectPage(model.objectId, pathname, searchParams),
    [model.objectId, pathname, searchParams],
  );
  const effectiveFieldReferenceType =
    activeFieldReferenceType ?? fieldReferenceTypeFromUrl;
  const defaultFeedSub = model.feedSubTabs[0]?.segment ?? 'posts';
  const [activeFeedSubSegment, setActiveFeedSubSegment] = useState(defaultFeedSub);
  const { openLogin } = useLoginModal();

  const supportedUpdateTypes = useMemo(() => {
    const registryEntry =
      OBJECT_TYPE_REGISTRY[model.objectTypeKey as keyof typeof OBJECT_TYPE_REGISTRY];
    return registryEntry?.supported_updates ?? [];
  }, [model.objectTypeKey]);

  const objectFollowersFeed = useMemo(() => {
    if (embeddedFollowersPage == null) {
      return null;
    }
    return (
      <UserSocialAccountList
        key={`${model.objectId}-${followersSort}`}
        profileAccountName={model.objectId}
        listKind="followers"
        initialPage={embeddedFollowersPage}
        sort={followersSort}
        currentUsername={viewerUsername}
        loadMoreAction={loadMoreObjectFollowersAction}
        onBroadcastRevalidate={revalidateObjectAfterBroadcast}
      />
    );
  }, [embeddedFollowersPage, followersSort, model.objectId, viewerUsername]);

  const objectExpertsFeed = useMemo(() => {
    if (embeddedExpertsPage == null) {
      return null;
    }
    return (
      <ObjectExpertsAccountList
        key={model.objectId}
        objectId={model.objectId}
        initialPage={embeddedExpertsPage}
        currentUsername={viewerUsername}
        loadMoreAction={loadMoreObjectExpertsAction}
        onBroadcastRevalidate={revalidateObjectAfterBroadcast}
      />
    );
  }, [embeddedExpertsPage, model.objectId, viewerUsername]);

  const objectRelatedFeed = useMemo(() => {
    if (embeddedRelatedPage == null) {
      return null;
    }
    return (
      <ObjectRefListFeed
        key={`${model.objectId}-related`}
        objectId={model.objectId}
        relation="related"
        initialItems={embeddedRelatedPage.items}
        initialCursor={embeddedRelatedPage.cursor}
        initialHasMore={embeddedRelatedPage.hasMore}
        viewerUsername={viewerUsername}
        onRequireLogin={openLogin}
        loadMoreAction={loadMoreObjectRefListAction}
      />
    );
  }, [embeddedRelatedPage, model.objectId, openLogin, viewerUsername]);

  const objectSimilarFeed = useMemo(() => {
    if (embeddedSimilarPage == null) {
      return null;
    }
    return (
      <ObjectRefListFeed
        key={`${model.objectId}-similar`}
        objectId={model.objectId}
        relation="similar"
        initialItems={embeddedSimilarPage.items}
        initialCursor={embeddedSimilarPage.cursor}
        initialHasMore={embeddedSimilarPage.hasMore}
        viewerUsername={viewerUsername}
        onRequireLogin={openLogin}
        loadMoreAction={loadMoreObjectRefListAction}
      />
    );
  }, [embeddedSimilarPage, model.objectId, openLogin, viewerUsername]);

  const objectAddOnFeed = useMemo(() => {
    if (embeddedAddOnPage == null) {
      return null;
    }
    return (
      <ObjectRefListFeed
        key={`${model.objectId}-add-on`}
        objectId={model.objectId}
        relation="add-on"
        initialItems={embeddedAddOnPage.items}
        initialCursor={embeddedAddOnPage.cursor}
        initialHasMore={embeddedAddOnPage.hasMore}
        viewerUsername={viewerUsername}
        onRequireLogin={openLogin}
        loadMoreAction={loadMoreObjectRefListAction}
      />
    );
  }, [embeddedAddOnPage, model.objectId, openLogin, viewerUsername]);

  const objectCategoryFeed = useMemo(() => {
    if (effectiveCategoryName == null) {
      return null;
    }
    const page = embeddedCategoryPage ?? {
      items: [],
      hasMore: false,
      cursor: null,
    };
    return (
      <ObjectCategoryObjectsFeed
        key={`${model.objectId}-category-${effectiveCategoryName}`}
        objectId={model.objectId}
        categoryName={effectiveCategoryName}
        initialItems={page.items}
        initialCursor={page.cursor}
        initialHasMore={page.hasMore}
        viewerUsername={viewerUsername}
        onRequireLogin={openLogin}
        loadMoreAction={loadMoreCategoryObjectsAction}
      />
    );
  }, [
    effectiveCategoryName,
    embeddedCategoryPage,
    model.objectId,
    openLogin,
    viewerUsername,
  ]);

  const objectFieldReferencesFeed = useMemo(() => {
    if (effectiveFieldReferenceType == null) {
      return null;
    }
    if (
      !isFieldReferenceSourceType(model.objectTypeKey) ||
      !isAllowedFieldReferenceObjectType(model.objectTypeKey, effectiveFieldReferenceType)
    ) {
      return null;
    }
    if (embeddedFieldReferencesPage == null) {
      return null;
    }
    return (
      <ObjectFieldReferencesListFeed
        key={`${model.objectId}-field-references-${effectiveFieldReferenceType}`}
        objectId={model.objectId}
        referenceObjectType={effectiveFieldReferenceType}
        initialItems={embeddedFieldReferencesPage.items}
        initialCursor={embeddedFieldReferencesPage.cursor}
        initialHasMore={embeddedFieldReferencesPage.hasMore}
        viewerUsername={viewerUsername}
        onRequireLogin={openLogin}
        loadMoreAction={loadMoreObjectFieldReferencesAction}
      />
    );
  }, [
    effectiveFieldReferenceType,
    embeddedFieldReferencesPage,
    model.objectId,
    model.objectTypeKey,
    openLogin,
    viewerUsername,
  ]);

  const loadMoreObjectAuthority = useMemo(
    () => (profileAccountName: string, sort: UserSubscriptionSort, skip: number) =>
      loadMoreObjectAuthorityAction(profileAccountName, authoritySubType, sort, skip),
    [authoritySubType],
  );

  const objectAuthorityFeed = useMemo(() => {
    if (embeddedAuthorityPage == null) {
      return null;
    }
    const viewerHasThisAuthority =
      authoritySubType === 'administrative'
        ? model.hasAdministrativeAuthority
        : model.hasOwnershipAuthority;
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-card border border-border bg-bg px-card-padding pt-2">
          <ObjectAuthoritySubNav
            administrativeCount={model.administrativeAuthorityCount}
            ownershipCount={model.ownershipAuthorityCount}
            activeSub={authoritySubType}
            onSelect={onAuthoritySubSelect}
          />
        </div>
        <AuthorityActionButton
          objectId={model.objectId}
          authorityType={authoritySubType}
          hasAuthority={viewerHasThisAuthority}
          viewerUsername={viewerUsername}
          onRequireLogin={openLogin}
        />
        <UserSocialAccountList
          key={`${model.objectId}-${authoritySubType}-${authoritySort}`}
          profileAccountName={model.objectId}
          listKind={
            authoritySubType === 'administrative'
              ? 'authority_administrative'
              : 'authority_ownership'
          }
          initialPage={embeddedAuthorityPage}
          sort={authoritySort}
          currentUsername={viewerUsername}
          loadMoreAction={loadMoreObjectAuthority}
          onBroadcastRevalidate={revalidateObjectAfterBroadcast}
        />
      </div>
    );
  }, [
    authoritySort,
    authoritySubType,
    embeddedAuthorityPage,
    loadMoreObjectAuthority,
    model.administrativeAuthorityCount,
    model.hasAdministrativeAuthority,
    model.hasOwnershipAuthority,
    model.objectId,
    model.ownershipAuthorityCount,
    onAuthoritySubSelect,
    openLogin,
    viewerUsername,
  ]);

  const menuRootName = defaultNestedContent?.name ?? null;

  const hostPageContent = useMemo(
    () => resolveHostPageContent(model),
    [model.objectType, model.objectTypeKey, model.pageContent, model.legalText],
  );

  const galleryPhotosAlbum = useMemo(
    () => resolveGalleryPhotosAlbum(model.galleryAlbums, model.previewGallery),
    [model.galleryAlbums, model.previewGallery],
  );

  return (
    <ObjectPrimaryContent
      objectId={model.objectId}
      activePrimarySegment={activePrimarySegment}
      activeFeedSubSegment={activeFeedSubSegment}
      feedSubTabs={model.feedSubTabs}
      title={model.title}
      objectType={model.objectType}
      listItems={model.listItems}
      listItemsSortCustom={model.listItemsSortCustom}
      initialNestedStack={initialNestedStack}
      defaultNestedContent={defaultNestedContent}
      menuRootName={menuRootName}
      onFeedSubSelect={setActiveFeedSubSegment}
      objectUpdatesFeed={updatesFeedSlot}
      objectPostsFeed={postsFeedSlot}
      objectThreadsFeed={threadsFeedSlot}
      objectFollowersFeed={objectFollowersFeed}
      objectExpertsFeed={objectExpertsFeed}
      objectAuthorityFeed={objectAuthorityFeed}
      objectRelatedFeed={objectRelatedFeed}
      objectSimilarFeed={objectSimilarFeed}
      objectAddOnFeed={objectAddOnFeed}
      objectCategoryFeed={objectCategoryFeed}
      objectFieldReferencesFeed={objectFieldReferencesFeed}
      hostPageContent={hostPageContent}
      hostWidgetConfig={model.widgetConfig}
      descriptionContent={model.descriptionContent}
      previewGallery={model.previewGallery}
      galleryPhotosAlbum={galleryPhotosAlbum}
      galleryAlbums={model.galleryAlbums}
      onChainGalleryAlbumNames={model.onChainGalleryAlbumNames}
      activeGalleryAlbum={activeGalleryAlbum}
      onOpenGalleryAlbum={onOpenGalleryAlbum}
      onBackToGalleryAlbums={onBackToGalleryAlbums}
      onOpenGalleryPhoto={onOpenGalleryPhoto}
      supportedUpdateTypes={supportedUpdateTypes}
      updateTypeCounts={model.updateTypeCounts}
      viewerUsername={viewerUsername}
      onRequireLogin={openLogin}
      objectTypeKey={model.objectTypeKey}
      relatedAlbumPreview={relatedAlbumPreview}
      relatedAlbumInitialPage={relatedAlbumInitialPage}
    />
  );
}
