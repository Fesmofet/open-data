/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

jest.mock('@/shared/presentation', () => ({
  StatHoverTooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/shared/presentation/layout/use-horizontal-tab-overflow', () => ({
  useHorizontalTabOverflow: ({ tabCount }: { tabCount: number }) => ({
    rowRef: () => undefined,
    setTabRef: () => undefined,
    overflowIndices: [],
    hasOverflow: false,
    hasMeasured: true,
  }),
}));

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  global.ResizeObserver = MockResizeObserver as typeof ResizeObserver;
});

import { ObjectPrimaryNav } from './object-primary-nav';

const messages = {
  object_detail_primary_nav_aria: 'Object sections',
  object_detail_nav_more: 'More',
  stat_object_followers_tooltip: 'Followers tooltip',
  stat_object_expertise_tooltip: 'Experts tooltip',
};

function renderNav(
  tabs: Parameters<typeof ObjectPrimaryNav>[0]['tabs'],
  activeSegment = 'reviews',
) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <ObjectPrimaryNav tabs={tabs} activeSegment={activeSegment} onSelect={() => undefined} />
    </I18nProvider>,
  );
}

describe('ObjectPrimaryNav', () => {
  it('renders a space between Followers label and zero count', () => {
    renderNav([
      { segment: 'reviews', label: 'Reviews' },
      { segment: 'followers', label: 'Followers', count: 0 },
    ]);

    expect(screen.getByRole('button', { name: 'Followers 0' })).toBeInTheDocument();
  });

  it('renders a space between Experts label and count', () => {
    renderNav([
      { segment: 'reviews', label: 'Reviews' },
      { segment: 'experts', label: 'Experts', count: 3 },
    ]);

    expect(screen.getByRole('button', { name: 'Experts 3' })).toBeInTheDocument();
  });
});
