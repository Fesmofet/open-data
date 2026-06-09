'use client';

import { useCallback, useEffect, useState } from 'react';

import { loadPostDiscussionAction } from '@/app/(app)/user-profile/[name]/post-discussion.actions';
import { useI18n } from '@/i18n/providers/i18n-provider';

import type { FeedStoryView } from '../../application/dto/feed-story.dto';
import type { PostDiscussionView } from '../../application/dto/post-discussion.dto';
import {
  type DiscussionCommentSort,
  sortDiscussionComments,
} from '../../domain/sort-discussion-comments';

import { DiscussionCommentSortDropdown } from './discussion-comment-sort-dropdown';
import { StoryCommentRow } from './story-comment-row';

const ROOT_COMMENTS_PAGE_INCREMENT = 10;

export type StoryCommentsLayout = 'quick' | 'full';

type StoryCommentsSectionProps = {
  story: FeedStoryView;
  currentUsername: string | null;
  expanded: boolean;
  /** Feed cards: no sort UI (legacy `isQuickComments`). Full post / modal: header + sort. */
  layout?: StoryCommentsLayout;
};

export function StoryCommentsSection({
  story,
  currentUsername,
  expanded,
  layout = 'quick',
}: StoryCommentsSectionProps) {
  const { t } = useI18n();
  const isFullLayout = layout === 'full';
  const [discussion, setDiscussion] = useState<PostDiscussionView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<DiscussionCommentSort>(isFullLayout ? 'BEST' : 'NEWEST');
  const [visibleCount, setVisibleCount] = useState(ROOT_COMMENTS_PAGE_INCREMENT);

  const loadDiscussion = useCallback(async () => {
    if (!expanded) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await loadPostDiscussionAction(story.authorName, story.permlink);
      if (!result) {
        setDiscussion(null);
        setError('Comments could not be loaded.');
      } else {
        setDiscussion(result);
      }
    } catch {
      setError('Comments could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [expanded, story.authorName, story.permlink]);

  useEffect(() => {
    if (expanded && (story.children ?? 0) > 0) {
      void loadDiscussion();
    }
  }, [expanded, story.children, loadDiscussion]);

  useEffect(() => {
    if (!expanded) {
      setVisibleCount(ROOT_COMMENTS_PAGE_INCREMENT);
    }
  }, [expanded]);

  if (!expanded) {
    return null;
  }

  const rootComments =
    discussion == null
      ? []
      : sortDiscussionComments(
          discussion.rootCommentIds
            .map((id) => discussion.comments[id])
            .filter((c): c is FeedStoryView => c != null),
          sort,
        );

  const visibleRoots = rootComments.slice(0, visibleCount);
  const hasMoreRoots = rootComments.length > visibleCount;

  return (
    <section className="mt-3 border-t border-border pt-3" aria-label="Comments">
      {isFullLayout ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-body-lg font-weight-strong text-heading">{t('comments')}</h2>
          <DiscussionCommentSortDropdown value={sort} onChange={setSort} />
        </div>
      ) : null}

      {loading ? (
        <p className="text-body-sm text-muted" aria-live="polite">Loading comments…</p>
      ) : null}
      {error ? (
        <p className="text-body-sm text-error" role="alert">{error}</p>
      ) : null}

      {!loading && discussion && rootComments.length === 0 ? (
        <p className="text-body-sm text-muted">No comments yet.</p>
      ) : null}

      {discussion ? (
        <ul className="flex flex-col gap-3">
          {visibleRoots.map((comment) => (
            <StoryCommentRow
              key={comment.id}
              comment={comment}
              discussion={discussion}
              rootStory={story}
              currentUsername={currentUsername}
              onDiscussionRefresh={() => void loadDiscussion()}
            />
          ))}
        </ul>
      ) : null}

      {hasMoreRoots ? (
        <button
          type="button"
          className="mt-3 rounded-btn px-2 py-1 text-body-sm text-accent hover:underline"
          onClick={() => setVisibleCount((n) => n + ROOT_COMMENTS_PAGE_INCREMENT)}
        >
          Show more comments
        </button>
      ) : null}
    </section>
  );
}
