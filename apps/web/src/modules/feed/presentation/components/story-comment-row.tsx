'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { feedExcerptToSafeHtml } from '@/shared/infrastructure/feed-excerpt-html';
import { UserAvatar } from '@/shared/presentation';

import type { FeedStoryView } from '../../application/dto/feed-story.dto';
import type { PostDiscussionView } from '../../application/dto/post-discussion.dto';

import { StoryCommentEditor } from './story-comment-editor';
import { formatRelativeFeedTime } from './story-utils';
import { StoryVoteButton } from './story-vote-button';

type StoryCommentRowProps = {
  comment: FeedStoryView;
  discussion: PostDiscussionView;
  rootStory: FeedStoryView;
  currentUsername: string | null;
  depth?: number;
  onDiscussionRefresh: () => void;
};

export function StoryCommentRow({
  comment,
  discussion,
  rootStory,
  currentUsername,
  depth = 0,
  onDiscussionRefresh,
}: StoryCommentRowProps) {
  const { locale } = useI18n();
  const [replyOpen, setReplyOpen] = useState(false);
  const childIds = discussion.childrenById[comment.id] ?? [];
  const displayAuthor = comment.authorDisplayName ?? comment.authorName;
  const profileHref = `/@${encodeURIComponent(comment.authorName)}`;

  return (
    <li className="list-none">
      <article
        className="rounded-btn border border-border bg-surface-control/60 p-3"
        style={{ marginLeft: depth > 0 ? `${Math.min(depth, 4) * 0.75}rem` : undefined }}
      >
        <header className="flex gap-2">
          <Link
            href={profileHref}
            suppressHydrationWarning
            className="shrink-0 rounded-circle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <UserAvatar
              username={comment.authorName}
              avatarUrl={comment.authorAvatarUrl}
              displayName={displayAuthor}
              size={32}
            />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <Link
                href={profileHref}
                suppressHydrationWarning
                className="font-weight-label text-body-sm text-fg hover:underline"
              >
                {displayAuthor}
              </Link>
              <time className="text-caption text-fg-tertiary" dateTime={comment.createdAt}>
                {formatRelativeFeedTime(comment.createdAt, locale)}
              </time>
            </div>
            <div
              className="mt-1 text-body-sm text-fg [&_a]:text-accent [&_a]:underline [&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: feedExcerptToSafeHtml(comment.excerpt) }}
            />
          </div>
        </header>
        <footer className="mt-2 flex flex-wrap items-center gap-2">
          <StoryVoteButton
            authorName={comment.authorName}
            permlink={comment.permlink}
            votes={comment.votes}
            currentUsername={currentUsername}
          />
          {currentUsername ? (
            <button
              type="button"
              className="rounded-btn px-2 py-0.5 text-caption text-muted hover:bg-surface-control hover:text-fg-secondary"
              onClick={() => setReplyOpen((v) => !v)}
            >
              Reply
            </button>
          ) : null}
        </footer>
        {replyOpen && currentUsername ? (
          <div className="mt-3 border-t border-border pt-3">
            <StoryCommentEditor
              story={rootStory}
              currentUsername={currentUsername}
              parentAuthor={comment.authorName}
              parentPermlink={comment.permlink}
              onSubmitted={() => {
                setReplyOpen(false);
                onDiscussionRefresh();
              }}
            />
          </div>
        ) : null}
      </article>
      {childIds.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-2">
          {childIds.map((childId) => {
            const child = discussion.comments[childId];
            if (!child) {
              return null;
            }
            return (
              <StoryCommentRow
                key={childId}
                comment={child}
                discussion={discussion}
                rootStory={rootStory}
                currentUsername={currentUsername}
                depth={depth + 1}
                onDiscussionRefresh={onDiscussionRefresh}
              />
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}
