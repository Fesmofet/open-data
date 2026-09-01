/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { LocaleId, Messages } from '@/i18n/types';

import { DiscoverMobileHeader } from './discover-mobile-header';

jest.mock('@/shared/presentation', () => ({
  useInstantNavigation: () => ({ navigateInstant: jest.fn() }),
}));

jest.mock('./discover-sort-select', () => ({
  DiscoverSortSelect: () => <div data-testid="sort-select" />,
}));

const messages = {
  discover_page_title: 'Discover',
  discover_all_users: 'All users',
  discover_type_all: 'All types',
  discover_select_type: 'Select type',
  discover_filters_title: 'Filters',
  discover_add_filter: 'Add',
  discover_map: 'Map',
  discover_map_area_filter: 'Map area',
  discover_remove_map_area: 'Remove map area',
  discover_remove_search: 'Remove search {query}',
  discover_remove_filter: 'Remove filter {tag}',
} as Messages;

function renderHeader(
  props: Partial<React.ComponentProps<typeof DiscoverMobileHeader>> = {},
) {
  render(
    <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
      <DiscoverMobileHeader
        usersMode={false}
        objectType="restaurant"
        q=""
        tags={[]}
        sort="rank"
        box={null}
        map={null}
        showFilters
        showMap
        onOpenTypeSheet={jest.fn()}
        onOpenFilterSheet={jest.fn()}
        onOpenMapSheet={jest.fn()}
        {...props}
      />
    </I18nProvider>,
  );
}

describe('DiscoverMobileHeader map entry', () => {
  it('shows Map control for geo-capable types', () => {
    renderHeader({ objectType: 'restaurant', showMap: true });
    expect(screen.getByRole('button', { name: 'Map' })).toBeInTheDocument();
  });

  it('hides Map control for non-geo types', () => {
    renderHeader({ objectType: 'book', showMap: false, showFilters: false });
    expect(screen.queryByRole('button', { name: 'Map' })).not.toBeInTheDocument();
  });

  it('hides Map control in users mode', () => {
    renderHeader({ usersMode: true, showMap: false, showFilters: false });
    expect(screen.queryByRole('button', { name: 'Map' })).not.toBeInTheDocument();
  });
});
