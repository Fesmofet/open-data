import type { FeedTab } from '../../domain/feed-tab';
import type { FeedStoryView } from '../../application/dto/feed-story.dto';
import { StoryContainer } from './story-container';

export type FeedListProps = {
  items: FeedStoryView[];
  feedTab: FeedTab;
  currentUsername: string | null;
  /** Extra cache/path revalidation after a Hive broadcast (e.g. object Reviews feed). */
  onBroadcastRevalidate?: () => Promise<void>;
};

export function FeedList({
  items,
  feedTab,
  currentUsername,
  onBroadcastRevalidate,
}: FeedListProps) {
  return (
    <ul className="flex list-none flex-col gap-card-padding p-0">
      {items.map((story) => (
        <li key={story.id} className="relative">
          <StoryContainer
            story={story}
            feedTab={feedTab}
            currentUsername={currentUsername}
            onBroadcastRevalidate={onBroadcastRevalidate}
          />
        </li>
      ))}
    </ul>
  );
}
