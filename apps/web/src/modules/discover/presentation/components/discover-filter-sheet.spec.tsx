/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { LocaleId, Messages } from '@/i18n/types';

import { DiscoverFilterSheet } from './discover-filter-sheet';

const navigateInstant = jest.fn();

jest.mock('@/shared/presentation', () => ({
  ModalShell: ({
    open,
    children,
    header,
    footer,
  }: {
    open: boolean;
    children: React.ReactNode;
    header?: React.ReactNode;
    footer?: React.ReactNode;
  }) =>
    open ? (
      <div role="dialog">
        {header}
        {children}
        {footer}
      </div>
    ) : null,
  useInstantNavigation: () => ({ navigateInstant }),
}));

jest.mock('../hooks/use-discover-tag-categories', () => ({
  useDiscoverTagCategories: () => ({
    loading: false,
    orderedSections: [
      {
        category: 'Cuisine',
        items: [
          { value: 'Sushi', count: 3 },
          { value: 'Pizza', count: 5 },
        ],
      },
      {
        category: 'Features',
        items: [{ value: 'Takeout', count: 9 }],
      },
    ],
    collapsedCategories: new Set<string>(),
    toggleCollapse: jest.fn(),
  }),
}));

const messages = {
  discover_filters_title: 'Filters',
  discover_clear: 'Clear',
  discover_search_filters: 'Search filters...',
  discover_show_results: 'Show results',
} as Messages;

function renderFilterSheet(
  props: Partial<React.ComponentProps<typeof DiscoverFilterSheet>> = {},
) {
  const onClose = jest.fn();
  render(
    <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
      <DiscoverFilterSheet
        open
        onClose={onClose}
        objectType="restaurant"
        q=""
        tags={[]}
        sort="rank"
        {...props}
      />
    </I18nProvider>,
  );
  return { onClose };
}

describe('DiscoverFilterSheet', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    navigateInstant.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('applies checked facet as encoded tag', async () => {
    renderFilterSheet();
    fireEvent.click(screen.getByRole('checkbox', { name: /Sushi/i }));
    jest.advanceTimersByTime(300);
    await waitFor(() => {
      expect(navigateInstant).toHaveBeenCalledWith({
        href: '/discover?type=restaurant&tags=Cuisine%3ASushi',
        method: 'replace',
        scroll: false,
      });
    });
  });

  it('clears filters and text query', () => {
    renderFilterSheet({ q: 'agassiz', tags: ['Cuisine:Sushi', 'Features:WiFi'] });
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(navigateInstant).toHaveBeenCalledWith({
      href: '/discover?type=restaurant',
      method: 'replace',
      scroll: false,
    });
  });

  it('closes without navigation when Show results is clicked', () => {
    const { onClose } = renderFilterSheet({ tags: ['Cuisine:Sushi'] });
    fireEvent.click(screen.getByRole('button', { name: 'Show results' }));
    expect(onClose).toHaveBeenCalled();
    expect(navigateInstant).not.toHaveBeenCalled();
  });

  it('narrows filter items locally without navigation', () => {
    renderFilterSheet();
    fireEvent.change(screen.getByPlaceholderText('Search filters...'), {
      target: { value: 'sus' },
    });
    expect(screen.getByRole('checkbox', { name: /Sushi/i })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Pizza/i })).not.toBeInTheDocument();
    expect(navigateInstant).not.toHaveBeenCalled();
  });
});
