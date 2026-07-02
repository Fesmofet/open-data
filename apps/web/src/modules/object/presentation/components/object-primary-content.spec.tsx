/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

jest.mock('@/shared/presentation/layout', () => ({
  FeedColumn: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/shared/presentation', () => ({
  useInstantNavigation: () => ({
    navigateInstant: jest.fn(),
    isNavigating: false,
  }),
}));

jest.mock('../../application/actions/resolve-nested-object-content.action', () => ({
  resolveNestedObjectContentAction: jest.fn(),
}));

jest.mock('../../application/actions/resolve-nested-object-path.action', () => ({
  resolveNestedObjectPathAction: jest.fn(),
}));

jest.mock('./object-write-review-prompt', () => ({
  ObjectWriteReviewPrompt: () => null,
}));

jest.mock('./object-feed-sub-nav', () => ({
  ObjectFeedSubNav: () => null,
}));

jest.mock('./object-gallery-tab-content', () => ({
  ObjectGalleryTabContent: () => null,
}));

jest.mock('./object-list-content', () => ({
  ObjectListContent: () => null,
}));

jest.mock('./object-related-album-section', () => ({
  ObjectRelatedAlbumSection: () => null,
}));

jest.mock('./object-center-breadcrumbs', () => ({
  ObjectCenterBreadcrumbs: () => null,
}));

jest.mock('./object-nested-page-body', () => ({
  ObjectNestedPageBody: () => null,
}));

import { ObjectPrimaryContent } from './object-primary-content';

const EMPTY_NESTED_STACK: never[] = [];

const baseProps = {
  objectId: 'waivio',
  activePrimarySegment: 'reviews',
  activeFeedSubSegment: 'posts',
  feedSubTabs: [
    { segment: 'posts', label: 'Posts' },
    { segment: 'threads', label: 'Threads' },
  ],
  title: 'Waivio',
  objectType: 'default' as const,
  listItems: [],
  initialNestedStack: EMPTY_NESTED_STACK,
  onFeedSubSelect: jest.fn(),
};

describe('ObjectPrimaryContent Reviews posts feed', () => {
  it('renders injected object posts feed on Reviews > Posts', () => {
    render(
      <ObjectPrimaryContent
        {...baseProps}
        objectPostsFeed={<div data-testid="object-posts-feed">Feed</div>}
      />,
    );
    expect(screen.getByTestId('object-posts-feed')).toBeInTheDocument();
    expect(screen.queryByText(/Posts list placeholder/)).not.toBeInTheDocument();
  });

  it('falls back to type content when Reviews > Posts has no feed slot', () => {
    render(<ObjectPrimaryContent {...baseProps} />);
    expect(screen.getByText(/Reviews and discussions \(mock\)/)).toBeInTheDocument();
    expect(screen.getByText(/Posts list placeholder/)).toBeInTheDocument();
  });
});

describe('ObjectPrimaryContent Reviews threads feed', () => {
  it('renders injected object threads feed on Reviews > Threads', () => {
    render(
      <ObjectPrimaryContent
        {...baseProps}
        activeFeedSubSegment="threads"
        objectThreadsFeed={<div data-testid="object-threads-feed">Threads</div>}
      />,
    );
    expect(screen.getByTestId('object-threads-feed')).toBeInTheDocument();
    expect(screen.queryByText(/Posts list placeholder/)).not.toBeInTheDocument();
  });

  it('falls back to type content when Reviews > Threads has no feed slot', () => {
    render(
      <ObjectPrimaryContent
        {...baseProps}
        activeFeedSubSegment="threads"
      />,
    );
    expect(screen.getByText(/Reviews and discussions \(mock\)/)).toBeInTheDocument();
    expect(screen.getByText(/Posts list placeholder/)).toBeInTheDocument();
  });
});
