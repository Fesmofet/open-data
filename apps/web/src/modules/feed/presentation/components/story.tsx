'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { feedExcerptToSafeHtml } from '@/shared/infrastructure/feed-excerpt-html';
import { isThreeSpeakEmbedUrl } from '@/shared/infrastructure/three-speak-preview';
import {
  AVATAR_PLACEHOLDER_SRC,
  shouldUnoptimizeRemoteImage,
  StatHoverTooltip,
  UserAvatar,
} from '@/shared/presentation';
import { objectPagePath } from '@/shared/routes/object-page-path';

import { objectFields } from '../../application/dto/object-fields';
import type { FeedStoryView } from '../../application/dto/feed-story.dto';
import type { FeedTab } from '../../domain/feed-tab';

import { useStoryPreviewMediaUrl } from '../hooks/use-story-preview-media-url';
import {
  FEED_STORY_PORTRAIT_PREVIEW_MAX_PX,
  FEED_STORY_TAGGED_OBJECT_MAX,
  formatRelativeFeedTime,
  formatReputation,
} from './story-utils';
import { StoryRewardBadge } from './story-reward-badge';
import { ObjectPageLink } from './object-page-link';
import { StoryCommentEditor } from './story-comment-editor';
import { StoryCommentsSection } from './story-comments-section';
import { StoryOverflowMenu } from './story-overflow-menu';
import { StoryReblogButton } from './story-reblog-button';
import { StoryStatButton } from './story-stat-button';
import { StoryVoteButton } from './story-vote-button';

type StoryProps = {
  story: FeedStoryView;
  feedTab?: FeedTab;
  currentUsername: string | null;
  onBroadcastRevalidate?: () => Promise<void>;
};

function IconComment({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconReblog({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function IconPlay() {
  return (
    <span
      className="inline-flex items-center justify-center rounded-circle bg-overlay/80 p-3 shadow-card"
      aria-hidden
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="ml-0.5 text-accent-fg"
      >
        <path d="M8 5v14l11-7L8 5z" />
      </svg>
    </span>
  );
}

function viewerIsAuthor(
  viewer: string | null,
  author: string,
): boolean {
  if (viewer == null || viewer === '') {
    return false;
  }
  return viewer.trim().toLowerCase() === author.trim().toLowerCase();
}

export function Story({
  story,
  feedTab,
  currentUsername,
  onBroadcastRevalidate,
}: StoryProps) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [previewMediaFailed, setPreviewMediaFailed] = useState(false);
  const [previewMediaLandscape, setPreviewMediaLandscape] = useState(true);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const { t, locale } = useI18n();
  const displayAuthor = story.authorDisplayName ?? story.authorName;
  const displayTimeIso = story.feedAt ?? story.createdAt;
  const relativeLabel = formatRelativeFeedTime(displayTimeIso, locale);
  const repLabel = formatReputation(story.authorWobjectsWeight, locale);
  const taggedObjects =
    story.objects && story.objects.length > 0
      ? story.objects.slice(0, FEED_STORY_TAGGED_OBJECT_MAX)
      : [];
  const isThreeSpeakVideo = isThreeSpeakEmbedUrl(story.videoEmbedUrl);
  const previewMediaUrl = useStoryPreviewMediaUrl(
    story.videoEmbedUrl,
    story.videoThumbnailUrl,
    story.thumbnailUrl,
  );
  const showPreviewBlock = isThreeSpeakVideo
    ? Boolean(story.videoEmbedUrl)
    : Boolean(previewMediaUrl);
  const showInlineVideo = Boolean(
    story.videoEmbedUrl && (isThreeSpeakVideo || videoPlaying),
  );
  const canPlayInline = Boolean(story.videoEmbedUrl) && !isThreeSpeakVideo;
  const isPostVideoActive = isThreeSpeakVideo || videoPlaying;

  useEffect(() => {
    setPreviewMediaFailed(false);
    setPreviewMediaLandscape(true);
  }, [previewMediaUrl]);

  const isOwnPost = viewerIsAuthor(currentUsername, story.authorName);
  const editorSearch = new URLSearchParams({
    author: story.authorName,
    permlink: story.permlink,
  });
  const editHref = `/editor?${editorSearch.toString()}`;
  const authorProfileHref = `/@${encodeURIComponent(story.authorName)}`;

  return (
    <article
      className="rounded-card border border-border bg-surface/80 p-card-padding shadow-whisper"
      aria-labelledby={`story-title-${story.id}`}
      data-feed-tab={feedTab}
    >
      {story.rebloggedBy ? (
        <p className="mb-3 rounded-btn bg-surface-control px-2 py-1 text-caption text-muted">
          Reblogged by{' '}
          <span className="font-weight-label text-fg-secondary">@{story.rebloggedBy}</span>
        </p>
      ) : null}

      <header className="flex gap-3">
        <Link
          href={authorProfileHref}
          suppressHydrationWarning
          className="inline-flex shrink-0 self-start rounded-circle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          aria-label={`View profile: @${story.authorName}`}
        >
          <UserAvatar
            username={story.authorName}
            avatarUrl={story.authorAvatarUrl}
            displayName={displayAuthor}
            size={40}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <Link
              href={authorProfileHref}
              suppressHydrationWarning
              className="font-weight-label text-body-sm text-fg hover:underline focus-visible:rounded-btn focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {displayAuthor}
            </Link>
            {repLabel != null ? (
              <StatHoverTooltip content={t('stat_user_expertise_tooltip')}>
                <span className="rounded bg-surface-control px-1.5 py-0.5 text-caption font-weight-label text-fg-secondary tabular-nums">
                  {repLabel}
                </span>
              </StatHoverTooltip>
            ) : null}
            <span className="text-caption text-muted">·</span>
            <time className="text-caption text-fg-tertiary" dateTime={displayTimeIso}>
              {relativeLabel}
            </time>
            {story.category ? (
              <>
                <span className="text-caption text-muted">·</span>
                <span className="text-caption text-fg-tertiary">{story.category}</span>
              </>
            ) : null}
          </div>
        </div>
        {taggedObjects.length > 0 ? (
          <ul
            className="flex max-w-[10rem] shrink-0 flex-wrap content-start justify-end gap-1.5 sm:max-w-none"
            aria-label="Tagged objects"
          >
            {taggedObjects.map((o) => {
              const chipImage = objectFields.image(o);
              const chipName = objectFields.name(o);
              const chipLabel = chipName ?? o.object_id;
              return (
                <li key={o.object_id} className="list-none">
                  <ObjectPageLink
                    href={objectPagePath(o.object_id)}
                    title={chipLabel}
                    ariaLabel={`View object: ${chipLabel}`}
                    className="inline-flex rounded-btn focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    <span className="flex size-10 items-center justify-center overflow-hidden rounded-btn border border-border bg-surface-control">
                      {chipImage ? (
                        <Image
                          src={chipImage}
                          alt=""
                          className="size-full object-cover"
                          width={40}
                          height={40}
                          sizes="40px"
                          unoptimized={shouldUnoptimizeRemoteImage(chipImage)}
                        />
                      ) : (
                        <Image
                          src={AVATAR_PLACEHOLDER_SRC}
                          alt=""
                          className="size-full object-cover"
                          width={40}
                          height={40}
                          sizes="40px"
                        />
                      )}
                    </span>
                  </ObjectPageLink>
                </li>
              );
            })}
          </ul>
        ) : null}
      </header>

      <div className="relative mt-3 min-w-0">
        {story.permalinkPath != null && !isPostVideoActive ? (
          <Link
            href={story.permalinkPath}
            suppressHydrationWarning
            className="absolute inset-0 z-[5] cursor-pointer rounded-btn"
            aria-label={
              story.title?.trim()
                ? `View post: ${story.title.trim()}`
                : `View post by @${story.authorName}`
            }
          >
            <span className="sr-only">
              {story.title?.trim() ? story.title.trim() : `Post by @${story.authorName}`}
            </span>
          </Link>
        ) : null}

        <div
          className={[
            'relative z-10 space-y-3',
            story.permalinkPath != null && !isPostVideoActive ? 'pointer-events-none' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {story.title ? (
            feedTab === 'comments' ? (
              <h2
                id={`story-title-${story.id}`}
                className="flex min-w-0 items-center gap-2 leading-body"
              >
                <span
                  className="inline-flex shrink-0 items-center justify-center rounded-btn bg-code-bg px-1.5 py-0.5 font-mono text-nano font-weight-strong uppercase leading-none tracking-loose text-code-fg"
                  aria-hidden
                >
                  RE
                </span>
                <span className="min-w-0 flex-1 text-body font-weight-label text-fg-secondary">
                  {story.title}
                </span>
              </h2>
            ) : (
              <h2
                id={`story-title-${story.id}`}
                className={[
                  'text-body-lg font-weight-strong',
                  story.permalinkPath ? 'feed-story-title-link' : 'text-heading',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {story.title}
              </h2>
            )
          ) : (
            <h2 id={`story-title-${story.id}`} className="sr-only">
              Post by {displayAuthor}
            </h2>
          )}

          {showPreviewBlock ? (
            <div
              className={
                showInlineVideo
                  ? 'relative aspect-video max-h-[260px] min-h-[180px] w-full overflow-hidden rounded-btn border border-border bg-surface-control'
                  : [
                      'rounded-btn border border-border bg-surface-control',
                      previewMediaLandscape
                        ? 'relative w-full'
                        : 'relative flex w-full items-center justify-center',
                    ].join(' ')
              }
            >
              {showInlineVideo && story.videoEmbedUrl ? (
                <>
                  <iframe
                    title={story.title ? `${story.title} — video` : 'Embedded video'}
                    src={story.videoEmbedUrl}
                    className="h-full w-full min-h-[180px] border-0 bg-black"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                  {!isThreeSpeakVideo ? (
                    <button
                      type="button"
                      className="absolute right-2 top-2 z-30 rounded-btn bg-overlay/90 px-2 py-1 text-caption font-weight-label text-fg shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      onClick={() => setVideoPlaying(false)}
                    >
                      Close
                    </button>
                  ) : null}
                </>
              ) : previewMediaFailed ? (
                <div
                  className="flex min-h-[180px] w-full items-center justify-center text-caption text-muted"
                  role="status"
                >
                  Preview unavailable
                </div>
              ) : previewMediaUrl ? (
                <div className={previewMediaLandscape ? 'relative w-full' : 'relative'}>
                  <Image
                    src={previewMediaUrl}
                    alt=""
                    width={1200}
                    height={800}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className={
                      previewMediaLandscape
                        ? 'block h-auto w-full object-contain'
                        : 'block h-auto w-auto max-w-full object-contain'
                    }
                    style={
                      previewMediaLandscape
                        ? undefined
                        : { maxHeight: FEED_STORY_PORTRAIT_PREVIEW_MAX_PX }
                    }
                    unoptimized={shouldUnoptimizeRemoteImage(previewMediaUrl)}
                    onLoad={(event) => {
                      const img = event.currentTarget;
                      setPreviewMediaLandscape(img.naturalWidth >= img.naturalHeight);
                    }}
                    onError={() => setPreviewMediaFailed(true)}
                  />
                  {canPlayInline ? (
                    <button
                      type="button"
                      className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setVideoPlaying(true);
                      }}
                      aria-label="Play video"
                    >
                      <IconPlay />
                    </button>
                  ) : null}
                </div>
              ) : (
                <div
                  className="flex min-h-[180px] w-full items-center justify-center text-caption text-muted"
                  role="status"
                >
                  Preview unavailable
                </div>
              )}
            </div>
          ) : null}

          <div
            suppressHydrationWarning
            className="feed-story-excerpt pointer-events-none min-h-[1.5em] text-body text-fg line-clamp-6 [&_a]:pointer-events-auto [&_a]:break-words [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_img]:pointer-events-auto [&_img]:my-2 [&_img]:h-auto [&_img]:max-w-full [&_p]:m-0 [&_p]:text-fg [&_p+p]:mt-2"
            dangerouslySetInnerHTML={{
              __html: feedExcerptToSafeHtml(story.excerpt, isThreeSpeakVideo
                ? {
                    omitImageUrls: [
                      previewMediaUrl,
                      story.thumbnailUrl,
                      story.videoThumbnailUrl,
                    ],
                    stripThreeSpeakLinks: true,
                  }
                : {
                    omitImageUrl: previewMediaUrl,
                  }),
            }}
          />
          {story.isNsfw ? (
            <p className="text-caption text-muted" role="status">
              NSFW
            </p>
          ) : null}
        </div>
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex flex-wrap items-center gap-1">
          <StoryVoteButton
            authorName={story.authorName}
            permlink={story.permlink}
            votes={story.votes}
            currentUsername={currentUsername}
            contentType={feedTab === 'threads' ? 'thread' : 'post'}
            onBroadcastRevalidate={onBroadcastRevalidate}
          />
          <StoryStatButton
            icon={<IconComment />}
            count={
              (story.children ?? 0) > 0 ? story.children : undefined
            }
            label="Comments"
            iconHoverAccent
            ariaPressed={commentsExpanded}
            onClick={() => setCommentsExpanded((v) => !v)}
          />
          {feedTab !== 'threads' && feedTab !== 'comments' ? (
            <StoryReblogButton
              authorName={story.authorName}
              permlink={story.permlink}
              rebloggedByViewer={story.rebloggedByViewer ?? false}
              currentUsername={currentUsername}
              isOwnPost={isOwnPost}
              onBroadcastRevalidate={onBroadcastRevalidate}
            />
          ) : null}
          <StoryOverflowMenu
            authorName={story.authorName}
            editHref={editHref}
            currentUsername={currentUsername}
            isOwnPost={isOwnPost}
          />
        </div>
        <StoryRewardBadge
          reward={story.reward}
          waivRewardEligible={story.waivRewardEligible ?? false}
          postAuthor={story.authorName}
        />
      </footer>
      {commentsExpanded ? (
        <>
          <StoryCommentsSection
            story={story}
            currentUsername={currentUsername}
            expanded
          />
          {currentUsername ? (
            <StoryCommentEditor
              story={story}
              currentUsername={currentUsername}
              onBroadcastRevalidate={onBroadcastRevalidate}
            />
          ) : null}
        </>
      ) : null}
    </article>
  );
}
