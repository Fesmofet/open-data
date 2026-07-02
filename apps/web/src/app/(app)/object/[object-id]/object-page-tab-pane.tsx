'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

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
import type { ObjectRefListPageView } from '@/modules/object/infrastructure/object-ref-list.client';
import { AuthorityActionButton } from '@/modules/object/presentation/components/authority-action-button';
import type {
  PaginatedUserFollowListView,
  UserSubscriptionSort,
} from '@/modules/user-social/application/dto/user-social.dto';
import { UserSocialAccountList } from '@/modules/user-social/presentation/components/user-social-account-list';
import { useLoginModal } from '@/modules/auth';

import { loadMoreObjectAuthorityAction } from './authority/object-authority.actions';
import { loadMoreObjectFollowersAction } from './followers/object-followers.actions';
import { loadMoreObjectRefListAction } from './related/load-more-ref-list.actions';
import { revalidateObjectAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';
import { useObjectPageShell } from './object-page-shell-context';

export type ObjectPageTabPaneProps = {
  model: ObjectPageViewModel;
  embeddedFollowersPage: PaginatedUserFollowListView | null;
  followersSort: UserSubscriptionSort;
  embeddedAuthorityPage: PaginatedUserFollowListView | null;
  authoritySubType: AuthoritySubType;
  authoritySort: UserSubscriptionSort;
  embeddedRelatedPage: ObjectRefListPageView | null;
  embeddedSimilarPage: ObjectRefListPageView | null;
  embeddedAddOnPage: ObjectRefListPageView | null;
  viewerUsername: string | null;
  relatedAlbumPreview?: RelatedAlbumPreviewView | null;
  relatedAlbumInitialPage?: RelatedAlbumListView | null;
  initialNestedStack: ObjectNestedViewResolved[];
  defaultNestedContent: ObjectNestedViewResolved | null;
  objectPageBody?: ReactNode;
  objectDescriptionBody?: ReactNode;
  updatesFeedSlot?: ReactNode;
  postsFeedSlot?: ReactNode;
};

export function ObjectPageTabPane({
  model,
  embeddedFollowersPage,
  followersSort,
  embeddedAuthorityPage,
  authoritySubType,
  authoritySort,
  embeddedRelatedPage,
  embeddedSimilarPage,
  embeddedAddOnPage,
  viewerUsername,
  relatedAlbumPreview = null,
  relatedAlbumInitialPage = null,
  initialNestedStack,
  defaultNestedContent,
  objectPageBody,
  objectDescriptionBody,
  updatesFeedSlot = null,
  postsFeedSlot = null,
}: ObjectPageTabPaneProps) {
  const {
    activePrimarySegment,
    activeGalleryAlbum,
    onAuthoritySubSelect,
    onOpenGalleryAlbum,
    onBackToGalleryAlbums,
    onOpenGalleryPhoto,
  } = useObjectPageShell();
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
      objectFollowersFeed={objectFollowersFeed}
      objectAuthorityFeed={objectAuthorityFeed}
      objectRelatedFeed={objectRelatedFeed}
      objectSimilarFeed={objectSimilarFeed}
      objectAddOnFeed={objectAddOnFeed}
      objectPageBody={objectPageBody}
      objectDescriptionBody={objectDescriptionBody}
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
