'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  ObjectPageViewModel,
  ObjectLeftRailBlock,
  AuthoritySubType,
} from '@/modules/object/domain/object-page.types';
import type { ProjectedGalleryAlbumView } from '@/modules/object/domain/object-page.types';
import { RELATED_ALBUM_NAME } from '@opden-data-layer/core/post-related-images';
import { galleryAlbumPickerNames } from '@/modules/object-updates/application/gallery-form-value';
import { ObjectGalleryViewer } from '@/modules/object/presentation/components/object-gallery-viewer';
import {
  LeftObjectProfileSidebar,
  ObjectHero,
  ObjectLeftRailPanel,
  ObjectPrimaryNav,
  ObjectEditRightRail,
  ObjectViewShell,
} from '@/modules/object';
import { getWalletFacade, useHydrateWalletProvider, useLoginModal } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { buildOdlObjectAuthorityOp, buildOdlObjectFollowOp } from '@opden-data-layer/hive-broadcast';
import { OBJECT_TYPE_REGISTRY } from '@opden-data-layer/core/object-type-registry';
import { useOdlCustomJsonId } from '@/config/odl-network-provider';
import {
  resolveUpdateTypeFilterForBlockKind,
  type ObjectLeftRailBlockKind,
} from '@/modules/object-updates/domain/block-update-type-map';
import { buildObjectGalleryAlbumPath } from '@/modules/object/domain/object-page-url.constants';
import { ObjectPageCenterSkeleton } from '@/modules/object/presentation/components/object-page-loading-skeleton';
import { useInstantNavigation } from '@/shared/presentation';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateObjectAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import {
  resolveGalleryAlbumForObjectPage,
  resolveDefaultPrimarySegmentFromLanding,
  resolvePrimarySegmentForObjectPage,
} from './object-page-search';
import {
  buildObjectAuthoritySubHref,
  buildObjectGalleryPath,
  buildObjectPrimaryTabNavigation,
  buildObjectUpdatesFieldHref,
} from './object-page-navigation';
import { fetchTagApprovalStatsAction } from './tag-approval.actions';
import { ObjectPageShellProvider } from './object-page-shell-context';

function tagSectionsFingerprintFromBlocks(blocks: readonly ObjectLeftRailBlock[]): string {
  for (const block of blocks) {
    if (block.kind !== 'tags') {
      continue;
    }
    return block.sections
      .map((section) =>
        [
          section.categoryTitle,
          section.tags
            .map((tag) => `${tag.value}#${tag.updateId ?? ''}`)
            .join(','),
        ].join(':'),
      )
      .join(';');
  }
  return '';
}

export type ObjectPageShellClientProps = {
  model: ObjectPageViewModel;
  viewerUsername: string | null;
  rightRailSlot: ReactNode;
  children: ReactNode;
};

export function ObjectPageShellClient({
  model,
  viewerUsername,
  rightRailSlot,
  children,
}: ObjectPageShellClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { navigateInstant, isNavigating } = useInstantNavigation();
  const { openLogin } = useLoginModal();
  useHydrateWalletProvider();
  const odlCustomJsonId = useOdlCustomJsonId();

  const [isEditMode, setEditMode] = useState(false);
  const [isFollowing, setFollowing] = useState(model.isFollowing);
  const [viewerBell, setViewerBell] = useState(model.viewerBell);
  const [followPending, setFollowPending] = useState(false);
  const [bellPending, setBellPending] = useState(false);
  const [isFavorite, setFavorite] = useState(model.hasAdministrativeAuthority);
  const [favoritePending, setFavoritePending] = useState(false);
  const defaultPrimaryWhenClean = useMemo(
    () =>
      resolveDefaultPrimarySegmentFromLanding(
        model.defaultLanding,
        model.primaryTabs.map((tab) => tab.segment),
      ),
    [model.defaultLanding, model.primaryTabs],
  );
  const [activePrimarySegment, setActivePrimarySegment] = useState(() =>
    resolvePrimarySegmentForObjectPage(
      model.objectId,
      pathname,
      searchParams,
      defaultPrimaryWhenClean,
    ),
  );
  const [activeGalleryAlbum, setActiveGalleryAlbum] = useState(() =>
    resolveGalleryAlbumForObjectPage(model.objectId, pathname, searchParams),
  );
  const [galleryFullView, setGalleryFullView] = useState<{
    album: ProjectedGalleryAlbumView;
    initialIndex: number;
  } | null>(null);
  const [tagApprovalStats, setTagApprovalStats] = useState<
    import('@/modules/object/domain/tag-approval-stats').TagApprovalStatsIndex | undefined
  >(undefined);

  const tagSectionsFingerprint = useMemo(
    () => tagSectionsFingerprintFromBlocks(model.leftRailBlocks),
    [model.leftRailBlocks],
  );

  useEffect(() => {
    if (!isEditMode || !viewerUsername) {
      setTagApprovalStats(undefined);
      return;
    }
    let cancelled = false;
    void fetchTagApprovalStatsAction(model.objectId).then((stats) => {
      if (!cancelled) {
        setTagApprovalStats(stats);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isEditMode, model.objectId, viewerUsername, tagSectionsFingerprint]);

  useEffect(() => {
    setActivePrimarySegment(
      resolvePrimarySegmentForObjectPage(
        model.objectId,
        pathname,
        searchParams,
        defaultPrimaryWhenClean,
      ),
    );
    setActiveGalleryAlbum(
      resolveGalleryAlbumForObjectPage(model.objectId, pathname, searchParams),
    );
  }, [defaultPrimaryWhenClean, model.objectId, pathname, searchParams]);

  useEffect(() => {
    setFavorite(model.hasAdministrativeAuthority);
  }, [model.hasAdministrativeAuthority, model.objectId]);

  useEffect(() => {
    setFollowing(model.isFollowing);
    setViewerBell(model.viewerBell);
  }, [model.isFollowing, model.viewerBell, model.objectId]);

  const onPrimarySelect = useCallback(
    (segment: string) => {
      setActivePrimarySegment(segment);
      if (segment === 'gallery') {
        setActiveGalleryAlbum(null);
      }
      const u = new URLSearchParams(searchParams.toString());
      const { href, method } = buildObjectPrimaryTabNavigation(
        model.objectId,
        segment,
        u,
      );
      navigateInstant({ href, method, scroll: false });
    },
    [model.objectId, navigateInstant, searchParams],
  );

  const supportedUpdateTypes = useMemo(() => {
    const registryEntry =
      OBJECT_TYPE_REGISTRY[model.objectTypeKey as keyof typeof OBJECT_TYPE_REGISTRY];
    return registryEntry?.supported_updates ?? [];
  }, [model.objectTypeKey]);

  const onViewFieldUpdates = useCallback(
    (kind: ObjectLeftRailBlockKind) => {
      const updateType = resolveUpdateTypeFilterForBlockKind(
        kind,
        supportedUpdateTypes,
        model.updateTypeCounts,
      );
      setActivePrimarySegment('updates');
      const href = buildObjectUpdatesFieldHref(
        model.objectId,
        new URLSearchParams(searchParams.toString()),
        updateType ?? null,
      );
      navigateInstant({ href, method: 'replace', scroll: false });
    },
    [model.objectId, model.updateTypeCounts, navigateInstant, searchParams, supportedUpdateTypes],
  );

  const onAuthoritySubSelect = useCallback(
    (sub: AuthoritySubType) => {
      const href = buildObjectAuthoritySubHref(
        model.objectId,
        new URLSearchParams(searchParams.toString()),
        sub,
      );
      navigateInstant({ href, method: 'replace', scroll: false });
    },
    [model.objectId, navigateInstant, searchParams],
  );

  const onOpenGalleryAlbum = useCallback(
    (albumName: string) => {
      setActiveGalleryAlbum(albumName);
      const href = buildObjectGalleryAlbumPath(model.objectId, albumName);
      navigateInstant({ href, method: 'push', scroll: false });
    },
    [model.objectId, navigateInstant],
  );

  const onBackToGalleryAlbums = useCallback(() => {
    setActiveGalleryAlbum(null);
    const href = buildObjectGalleryPath(model.objectId);
    navigateInstant({ href, method: 'replace', scroll: false });
  }, [model.objectId, navigateInstant]);

  const onOpenGalleryPhoto = useCallback(
    (album: ProjectedGalleryAlbumView, photoIndex: number) => {
      setGalleryFullView({ album, initialIndex: photoIndex });
    },
    [],
  );

  const onCloseGalleryFullView = useCallback(() => {
    setGalleryFullView(null);
  }, []);

  const onFollowToggle = useCallback(async () => {
    const account = viewerUsername?.trim();
    if (!account) {
      openLogin();
      return;
    }
    if (followPending) {
      return;
    }
    const method = isFollowing ? 'unfollow' : 'follow';
    const previousFollowing = isFollowing;
    const previousBell = viewerBell;
    setFollowing(!previousFollowing);
    if (previousFollowing) {
      setViewerBell(false);
    }
    setFollowPending(true);
    try {
      const op = buildOdlObjectFollowOp({
        id: odlCustomJsonId,
        objectId: model.objectId,
        method,
        required_posting_auths: [account],
      });
      const { transactionId } = await getWalletFacade().broadcast({
        operations: [op],
      });
      void awaitTrxConfirmation(transactionId).finally(() => {
        void refreshAfterBroadcast(router, () =>
          revalidateObjectAfterBroadcast(model.objectId),
        ).finally(() => {
          setFollowPending(false);
        });
      });
    } catch {
      setFollowing(previousFollowing);
      setViewerBell(previousBell);
      setFollowPending(false);
    }
  }, [
    followPending,
    isFollowing,
    model.objectId,
    odlCustomJsonId,
    openLogin,
    viewerBell,
    viewerUsername,
    router,
  ]);

  const onBellToggle = useCallback(async () => {
    const account = viewerUsername?.trim();
    if (!account) {
      openLogin();
      return;
    }
    if (bellPending || !isFollowing) {
      return;
    }
    const nextBell = !viewerBell;
    const previousBell = viewerBell;
    setViewerBell(nextBell);
    setBellPending(true);
    try {
      const op = buildOdlObjectFollowOp({
        id: odlCustomJsonId,
        objectId: model.objectId,
        method: 'bell',
        bell: nextBell,
        required_posting_auths: [account],
      });
      const { transactionId } = await getWalletFacade().broadcast({
        operations: [op],
      });
      void awaitTrxConfirmation(transactionId).finally(() => {
        void refreshAfterBroadcast(router, () =>
          revalidateObjectAfterBroadcast(model.objectId),
        ).finally(() => {
          setBellPending(false);
        });
      });
    } catch {
      setViewerBell(previousBell);
      setBellPending(false);
    }
  }, [
    bellPending,
    isFollowing,
    model.objectId,
    odlCustomJsonId,
    openLogin,
    viewerBell,
    viewerUsername,
    router,
  ]);

  const onFavoriteToggle = useCallback(async () => {
    const account = viewerUsername?.trim();
    if (!account) {
      openLogin();
      return;
    }
    if (favoritePending) {
      return;
    }
    const method = isFavorite ? 'remove' : 'add';
    const previous = isFavorite;
    setFavorite(!previous);
    setFavoritePending(true);
    try {
      const op = buildOdlObjectAuthorityOp({
        id: odlCustomJsonId,
        objectId: model.objectId,
        authorityType: 'administrative',
        method,
        required_posting_auths: [account],
      });
      const { transactionId } = await getWalletFacade().broadcast({
        operations: [op],
      });
      void awaitTrxConfirmation(transactionId).finally(() => {
        void refreshAfterBroadcast(router, () =>
          revalidateObjectAfterBroadcast(model.objectId),
        ).finally(() => {
          setFavoritePending(false);
        });
      });
    } catch {
      setFavorite(previous);
      setFavoritePending(false);
    }
  }, [
    favoritePending,
    isFavorite,
    model.objectId,
    odlCustomJsonId,
    openLogin,
    viewerUsername,
    router,
  ]);

  const galleryPhotosAlbum = useMemo(() => {
    const photosAlbum = model.galleryAlbums.find((album) => album.name === 'Photos');
    if (photosAlbum) {
      return photosAlbum;
    }
    if (model.previewGallery.length > 0) {
      return { name: 'Photos', items: model.previewGallery };
    }
    return null;
  }, [model.galleryAlbums, model.previewGallery]);

  const leftRailEditContext =
    isEditMode && viewerUsername
      ? {
          objectId: model.objectId,
          viewerUsername,
          supportedUpdateTypes,
          tagCategoryNames: model.tagCategoryNames,
          galleryAlbumNames: galleryAlbumPickerNames(model.onChainGalleryAlbumNames),
          onChainGalleryAlbumNames: model.onChainGalleryAlbumNames,
          updateTypeCounts: model.updateTypeCounts,
          onViewFieldUpdates,
        }
      : undefined;

  const defaultNestedTargetId =
    model.defaultLanding.kind === 'nestedInHost'
      ? model.defaultLanding.targetObjectId
      : null;

  const canOpenDescriptionPage =
    Boolean(model.descriptionContent?.trim()) || model.previewGallery.length > 0;

  const rightRail =
    isEditMode && viewerUsername ? (
      <ObjectEditRightRail model={model} />
    ) : (
      rightRailSlot
    );

  const leftRail = (
    <LeftObjectProfileSidebar>
      <ObjectLeftRailPanel
        blocks={model.leftRailBlocks}
        objectTypeKey={model.objectTypeKey}
        editContext={leftRailEditContext}
        objectId={model.objectId}
        defaultNestedTargetId={defaultNestedTargetId}
        canOpenDescriptionPage={canOpenDescriptionPage}
        objectName={model.title}
        galleryPhotosAlbum={galleryPhotosAlbum}
        onOpenGalleryPhoto={onOpenGalleryPhoto}
        supportedUpdateTypes={supportedUpdateTypes}
        updateTypeCounts={model.updateTypeCounts}
        viewerUsername={viewerUsername}
        onRequireLogin={openLogin}
        tagApprovalStats={tagApprovalStats}
      />
    </LeftObjectProfileSidebar>
  );

  const primaryNav = useMemo(
    () => (
      <ObjectPrimaryNav
        tabs={model.primaryTabs}
        activeSegment={activePrimarySegment}
        onSelect={onPrimarySelect}
      />
    ),
    [model.primaryTabs, activePrimarySegment, onPrimarySelect],
  );

  const shellContextValue = useMemo(
    () => ({
      activePrimarySegment,
      activeGalleryAlbum,
      onAuthoritySubSelect,
      onOpenGalleryAlbum,
      onBackToGalleryAlbums,
      onOpenGalleryPhoto,
      isNavigating,
    }),
    [
      activeGalleryAlbum,
      activePrimarySegment,
      isNavigating,
      onAuthoritySubSelect,
      onBackToGalleryAlbums,
      onOpenGalleryAlbum,
      onOpenGalleryPhoto,
    ],
  );

  return (
    <ObjectPageShellProvider value={shellContextValue}>
      <ObjectViewShell
        hero={
          <ObjectHero
            title={model.title}
            subtitleTitle={model.subtitleTitle}
            avatarUrl={model.avatarUrl}
            coverImageUrl={model.coverImageUrl}
            tagline={model.tagline}
            displayWeightLabel={model.displayWeightLabel}
            kindLabel={model.kindLabel}
            isEditMode={isEditMode}
            isFollowing={isFollowing}
            isBell={viewerBell}
            isFavorite={isFavorite}
            onToggleEdit={() => setEditMode((v) => !v)}
            onFollowToggle={onFollowToggle}
            onBellToggle={onBellToggle}
            onFavoriteToggle={onFavoriteToggle}
            primaryNav={primaryNav}
            editContext={
              isEditMode && viewerUsername
                ? {
                    objectId: model.objectId,
                    viewerUsername,
                    supportedUpdateTypes,
                  }
                : undefined
            }
          />
        }
        leftRail={leftRail}
        center={
          <div className="relative min-h-[12rem]">
            {children}
            {isNavigating ? (
              <div
                className="absolute inset-0 z-10 bg-bg/60 pt-2"
                aria-busy="true"
                aria-live="polite"
              >
                <ObjectPageCenterSkeleton />
              </div>
            ) : null}
          </div>
        }
        rightRail={rightRail}
      />
      {galleryFullView ? (
        <ObjectGalleryViewer
          objectId={model.objectId}
          objectName={model.title}
          album={galleryFullView.album}
          allGalleryAlbums={model.galleryAlbums}
          onChainGalleryAlbumNames={model.onChainGalleryAlbumNames}
          initialIndex={galleryFullView.initialIndex}
          onClose={onCloseGalleryFullView}
          viewerUsername={viewerUsername}
          onRequireLogin={openLogin}
          supportedUpdateTypes={supportedUpdateTypes}
          updateTypeCounts={model.updateTypeCounts}
          isVirtualRelatedAlbum={galleryFullView.album.name === RELATED_ALBUM_NAME}
        />
      ) : null}
    </ObjectPageShellProvider>
  );
}
