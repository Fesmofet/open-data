'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import Image from 'next/image';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { AddUpdateModal } from '@/modules/object-updates/presentation/components/add-update-modal';
import { shouldUnoptimizeRemoteImage, UserAvatar } from '@/shared/presentation';
import { ShellFullBleedBand, ShellInset } from '@/shared/presentation/layout';
import { HIDDEN_ON_DESKTOP_CLASS, shouldHideHeroOnDesktop, useShellMode } from '@/shell-mode';

export type ObjectHeroEditContext = {
  objectId: string;
  viewerUsername: string;
  supportedUpdateTypes: readonly string[];
};

export type ObjectHeroProps = {
  title: string;
  subtitleTitle: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  tagline: string | null;
  displayWeightLabel: string | null;
  kindLabel: string;
  /** Translated lifecycle status badge when not `active`. */
  statusBadgeLabel: string | null;
  isEditMode: boolean;
  isFollowing: boolean;
  isBell: boolean;
  isFavorite: boolean;
  onToggleEdit: () => void;
  onFollowToggle: () => void;
  onBellToggle: () => void;
  onFavoriteToggle: () => void;
  primaryNav: ReactNode;
  editContext?: ObjectHeroEditContext;
};

function IconBell({ filled }: { filled: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      className={filled ? 'text-accent' : 'text-current'}
      aria-hidden
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconHeartFavorite({ filled }: { filled: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      className={filled ? 'text-accent' : 'text-current'}
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

type HeroModalTarget = 'avatar-background' | 'name' | 'title';

export function ObjectHero({
  title,
  subtitleTitle,
  avatarUrl,
  coverImageUrl,
  tagline,
  displayWeightLabel,
  kindLabel,
  statusBadgeLabel,
  isEditMode,
  isFollowing,
  isBell,
  isFavorite,
  onToggleEdit,
  onFollowToggle,
  onBellToggle,
  onFavoriteToggle,
  primaryNav,
  editContext,
}: ObjectHeroProps) {
  const { t } = useI18n();
  const { resolvedMode } = useShellMode();
  const [modalTarget, setModalTarget] = useState<HeroModalTarget | null>(null);

  const hiddenOnDesktop = shouldHideHeroOnDesktop(resolvedMode);
  const hasCoverPhoto = Boolean(coverImageUrl?.trim());

  const canEditAvatar =
    isEditMode && editContext?.supportedUpdateTypes.includes('image');
  const canEditBackground =
    isEditMode && editContext?.supportedUpdateTypes.includes('imageBackground');
  const canEditName =
    isEditMode && editContext?.supportedUpdateTypes.includes('name');
  const canEditTitle =
    isEditMode && editContext?.supportedUpdateTypes.includes('title');

  function modalCandidates(target: HeroModalTarget): string[] {
    if (target === 'avatar-background') {
      return ['image', 'imageBackground'].filter((type) =>
        editContext?.supportedUpdateTypes.includes(type),
      );
    }
    if (target === 'name') return ['name'];
    if (target === 'title') return ['title'];
    return [];
  }

  return (
    <header className={hiddenOnDesktop ? HIDDEN_ON_DESKTOP_CLASS : undefined}>
      <ShellFullBleedBand className="relative overflow-hidden">
        {hasCoverPhoto && coverImageUrl ? (
          <div className="absolute inset-0">
            <Image
              src={coverImageUrl}
              alt=""
              fill
              priority={!hiddenOnDesktop}
              sizes="100vw"
              className="object-cover"
              unoptimized={shouldUnoptimizeRemoteImage(coverImageUrl)}
            />
            <div className="hero-cover-vignette absolute inset-0" aria-hidden />
            <div className="absolute inset-0 bg-nav-bg/65" aria-hidden />
          </div>
        ) : (
          <div className="absolute inset-0 bg-nav-bg" aria-hidden />
        )}

        <ShellInset
          className={[
            'relative z-10 pb-5 pt-6',
            hasCoverPhoto ? 'gallery-chrome-text' : 'text-nav-fg',
          ].join(' ')}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative shrink-0 self-start sm:self-end">
              <UserAvatar
                username=""
                avatarUrl={avatarUrl}
                displayName={title}
                size={96}
                isSquare
                className={hasCoverPhoto ? 'hero-on-photo-avatar' : undefined}
              />
              {(canEditAvatar || canEditBackground) ? (
                <button
                  type="button"
                  onClick={() => setModalTarget('avatar-background')}
                  className="absolute inset-0 flex items-center justify-center rounded-card bg-black/30 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
                  aria-label={t('object_detail_edit_avatar_background')}
                >
                  <span className="text-2xl font-light text-white/90">+</span>
                </button>
              ) : null}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              {canEditName ? (
                <button
                  type="button"
                  onClick={() => setModalTarget('name')}
                  className={[
                    'group/name relative -mx-1 -my-0.5 block w-full rounded-md px-1 py-0.5 text-left transition-colors',
                    hasCoverPhoto ? 'hover:bg-white/10' : 'hover:bg-black/5',
                  ].join(' ')}
                  aria-label={t('object_detail_edit_name')}
                >
                  <h1
                    className={[
                      'break-words text-section font-weight-strong font-display',
                      hasCoverPhoto ? 'hero-on-photo-title' : '',
                    ].join(' ')}
                  >
                    {title}
                  </h1>
                  <span
                    className={[
                      'absolute right-1.5 top-1/2 -translate-y-1/2 text-xl font-light opacity-0 transition-opacity group-hover/name:opacity-100',
                      hasCoverPhoto ? 'text-white/80' : 'text-accent',
                    ].join(' ')}
                    aria-hidden
                  >
                    +
                  </span>
                </button>
              ) : (
                <h1
                  className={[
                    'break-words text-section font-weight-strong font-display',
                    hasCoverPhoto ? 'hero-on-photo-title' : '',
                  ].join(' ')}
                >
                  {title}
                </h1>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={[
                    'rounded-btn px-2 py-0.5 text-caption font-weight-label',
                    hasCoverPhoto
                      ? 'hero-on-photo-chip'
                      : 'bg-ghost-surface text-nav-fg',
                  ].join(' ')}
                >
                  {kindLabel}
                </span>
                {displayWeightLabel ? (
                  <span
                    className={[
                      'rounded-btn px-2 py-0.5 text-caption font-weight-label tabular-nums',
                      hasCoverPhoto
                        ? 'hero-on-photo-chip'
                        : 'bg-ghost-surface text-nav-fg',
                    ].join(' ')}
                  >
                    {displayWeightLabel}
                  </span>
                ) : null}
              </div>
              {statusBadgeLabel ? (
                <p
                  className={[
                    'mt-1 text-caption font-weight-label uppercase tracking-caption text-error',
                    hasCoverPhoto ? 'hero-on-photo-status' : '',
                  ].join(' ')}
                >
                  {statusBadgeLabel}
                </p>
              ) : null}
              {subtitleTitle != null || canEditTitle ? (
                canEditTitle ? (
                  <button
                    type="button"
                    onClick={() => setModalTarget('title')}
                    className={[
                      'group/title relative -mx-1 mt-1 block w-full rounded-md px-1 py-0.5 text-left transition-colors',
                      hasCoverPhoto ? 'hover:bg-white/10' : 'hover:bg-black/5',
                    ].join(' ')}
                    aria-label={t('object_detail_edit_title')}
                  >
                    {subtitleTitle ? (
                      <p
                        className={[
                          'line-clamp-2 text-body-sm font-weight-body',
                          hasCoverPhoto ? 'hero-on-photo-muted' : 'opacity-90',
                        ].join(' ')}
                      >
                        {subtitleTitle}
                      </p>
                    ) : (
                      <span
                        className={[
                          'text-body-sm',
                          hasCoverPhoto ? 'text-white/40' : 'text-muted/50',
                        ].join(' ')}
                      >
                        {t('object_detail_add_title_placeholder')}
                      </span>
                    )}
                    <span
                      className={[
                        'absolute right-1.5 top-1/2 -translate-y-1/2 text-xl font-light opacity-0 transition-opacity group-hover/title:opacity-100',
                        hasCoverPhoto ? 'text-white/80' : 'text-accent',
                      ].join(' ')}
                      aria-hidden
                    >
                      +
                    </span>
                  </button>
                ) : subtitleTitle ? (
                  <p
                    className={[
                      'mt-1 line-clamp-2 text-body-sm font-weight-body',
                      hasCoverPhoto ? 'hero-on-photo-muted' : 'opacity-90',
                    ].join(' ')}
                  >
                    {subtitleTitle}
                  </p>
                ) : null
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2 self-end sm:pb-1">
              {canEditBackground ? (
                <button
                  type="button"
                  onClick={() => setModalTarget('avatar-background')}
                  className={[
                    'flex items-center gap-1 rounded-btn px-3 py-1.5 text-caption font-weight-label transition-colors',
                    hasCoverPhoto
                      ? 'border border-white/30 bg-black/30 text-white/90 backdrop-blur-sm hover:border-white/60 hover:bg-black/50 hover:text-white'
                      : 'border border-ghost-border bg-ghost-surface text-nav-fg hover:border-accent hover:text-accent',
                  ].join(' ')}
                  aria-label={t('object_detail_edit_background')}
                >
                  <span className="text-base leading-none">+</span>
                  {t('object_detail_edit_background')}
                </button>
              ) : null}
              <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={onFollowToggle}
                className={[
                  'group rounded-btn px-4 py-2 text-body-sm font-weight-label',
                  isFollowing
                    ? hasCoverPhoto
                      ? 'hero-on-photo-btn hero-on-photo-btn-destructive'
                      : 'hero-follow-active'
                    : 'bg-accent text-accent-fg hover:opacity-90',
                ].join(' ')}
              >
                <span className={isFollowing ? 'group-hover:hidden' : ''}>
                  {isFollowing ? t('object_detail_following') : t('object_detail_follow')}
                </span>
                {isFollowing ? (
                  <span className="hidden group-hover:inline">
                    {t('object_detail_unfollow')}
                  </span>
                ) : null}
              </button>
              {isFollowing ? (
                <button
                  type="button"
                  onClick={onBellToggle}
                  className={[
                    'rounded-btn p-2',
                    hasCoverPhoto
                      ? 'hero-on-photo-btn'
                      : 'border border-ghost-border bg-ghost-surface text-nav-fg hover:border-accent hover:text-accent',
                  ].join(' ')}
                  aria-pressed={isBell}
                  title={isBell ? t('object_detail_bell_on') : t('object_detail_bell_off')}
                  aria-label={isBell ? t('object_detail_bell_on') : t('object_detail_bell_off')}
                >
                  <IconBell filled={isBell} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={onToggleEdit}
                className={[
                  'rounded-btn px-4 py-2 text-body-sm font-weight-label',
                  hasCoverPhoto
                    ? 'hero-on-photo-btn'
                    : 'border border-ghost-border bg-ghost-surface text-nav-fg hover:border-accent hover:text-accent',
                ].join(' ')}
              >
                {isEditMode ? t('object_detail_view') : t('object_detail_edit')}
              </button>
              <button
                type="button"
                onClick={onFavoriteToggle}
                className={[
                  'rounded-btn p-2',
                  hasCoverPhoto
                    ? 'hero-on-photo-btn'
                    : 'border border-ghost-border bg-ghost-surface text-nav-fg hover:border-accent hover:text-accent',
                ].join(' ')}
                aria-pressed={isFavorite}
                title={
                  isFavorite
                    ? t('object_detail_favorites_remove')
                    : t('object_detail_favorites_add')
                }
                aria-label={
                  isFavorite
                    ? t('object_detail_favorites_remove')
                    : t('object_detail_favorites_add')
                }
              >
                <IconHeartFavorite filled={isFavorite} />
              </button>
              </div>
            </div>
          </div>
        </ShellInset>
      </ShellFullBleedBand>

      <ShellFullBleedBand className="border-t border-border bg-bg shadow-card">
        <ShellInset className="pb-3 pt-0">
          <div
            className={[
              'shell-profile-grid shell-object-page-grid grid grid-cols-1 gap-card-padding',
              'lg:grid-cols-[minmax(0,var(--shell-left-width))_minmax(0,1fr)_minmax(0,var(--shell-right-width))]',
            ].join(' ')}
          >
            <div className="shell-hide-instagram hidden lg:block" aria-hidden />
            <div className="min-w-0">{primaryNav}</div>
            <div className="shell-hide-instagram hidden lg:block" aria-hidden />
          </div>
        </ShellInset>
      </ShellFullBleedBand>

      {editContext && modalTarget ? (
        <AddUpdateModal
          open
          mode="leftRail"
          onClose={() => setModalTarget(null)}
          objectId={editContext.objectId}
          viewerUsername={editContext.viewerUsername}
          candidateUpdateTypes={modalCandidates(modalTarget)}
        />
      ) : null}
    </header>
  );
}
