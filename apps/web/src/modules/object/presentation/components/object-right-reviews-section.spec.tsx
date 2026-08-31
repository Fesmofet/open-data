/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import type { UserBlogFeedPage } from '@/modules/feed/application/dto/user-blog-feed-page.dto';

jest.mock('@/i18n/providers/i18n-provider', () => ({
  useI18n: () => ({
    t: (key: string) =>
      ({
        reviews: 'Reviews',
        object_right_show_more: 'Show more',
      })[key] ?? key,
  }),
}));

jest.mock('@/modules/feed/presentation', () => ({
  FeedList: ({ items }: { items: { id: string }[] }) => (
    <ul data-testid="feed-list">
      {items.map((item) => (
        <li key={item.id}>{item.id}</li>
      ))}
    </ul>
  ),
}));

import { ObjectRightReviewsSection } from './object-right-reviews-section';

function makePost(id: string) {
  return {
    id,
    author: 'alice',
    authorDisplayName: 'Alice',
    authorAvatarUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    title: `Post ${id}`,
    body: 'body',
    payout: 0,
    netVotes: 0,
    children: 0,
    pendingPayoutValue: 0,
    isPinned: false,
    isReblogged: false,
    rebloggedBy: null,
    firstComment: null,
    objectExpertise: null,
    mentions: [],
    tags: [],
    url: `/post/${id}`,
    jsonMetadata: null,
  };
}

function makePage(itemCount: number, hasMore: boolean): UserBlogFeedPage {
  return {
    items: Array.from({ length: itemCount }, (_, index) =>
      makePost(`post-${index}`),
    ) as unknown as UserBlogFeedPage['items'],
    cursor: hasMore ? 'cursor' : null,
    hasMore,
  };
}

describe('ObjectRightReviewsSection', () => {
  it('shows 5 of 6 posts and links Show more to Reviews tab', () => {
    render(
      <ObjectRightReviewsSection
        objectId="ehk-catch"
        page={makePage(6, true)}
        currentUsername={null}
      />,
    );

    expect(screen.getByTestId('feed-list').querySelectorAll('li')).toHaveLength(5);
    expect(screen.getByRole('link', { name: 'Show more' })).toHaveAttribute(
      'href',
      '/object/ehk-catch/reviews',
    );
  });

  it('omits the section when there are no posts', () => {
    const { container } = render(
      <ObjectRightReviewsSection
        objectId="ehk-catch"
        page={makePage(0, false)}
        currentUsername={null}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows 5 posts without Show more when hasMore is false', () => {
    render(
      <ObjectRightReviewsSection
        objectId="ehk-catch"
        page={makePage(5, false)}
        currentUsername={null}
      />,
    );

    expect(screen.getByTestId('feed-list').querySelectorAll('li')).toHaveLength(5);
    expect(screen.queryByRole('link', { name: 'Show more' })).not.toBeInTheDocument();
  });
});
