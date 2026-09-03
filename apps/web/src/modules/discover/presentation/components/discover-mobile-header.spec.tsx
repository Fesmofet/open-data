/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { LocaleId, Messages } from '@/i18n/types';

import { DiscoverMobileHeader } from './discover-mobile-header';

jest.mock('@/shared/presentation', () => ({
  useInstantNavigation: () => ({ navigateInstant: jest.fn() }),
  profileSectionTabClass: (active: boolean) => (active ? 'tab-active' : 'tab-inactive'),
}));

jest.mock('./discover-sort-select', () => ({
  DiscoverSortSelect: () => <div data-testid="sort-select" />,
}));

const messages = {
  discover_page_title: 'Discover',
  discover_all_users: 'All users',
  discover_type_all: 'All types',
  discover_select_type: 'Select type',
  discover_add_filter: 'Filter',
  discover_map: 'Map',
  object_list_tab: 'List',
  discover_map_view_nav_aria: 'Discover view',
  discover_map_area_filter: 'Map area',
  discover_remove_map_area: 'Remove map area',
  discover_remove_search: 'Remove search {query}',
  discover_remove_filter: 'Remove filter {tag}',
} as Messages;

function renderHeader(
  props: Partial<React.ComponentProps<typeof DiscoverMobileHeader>> = {},
) {
  const onMobileTabChange = jest.fn();
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
        mobileTab="list"
        onMobileTabChange={onMobileTabChange}
        onOpenTypeSheet={jest.fn()}
        onOpenFilterSheet={jest.fn()}
        {...props}
      />
    </I18nProvider>,
  );
  return { onMobileTabChange };
}

describe('DiscoverMobileHeader', () => {
  it('does not show duplicate Discover page title', () => {
    renderHeader();
    expect(screen.queryByText('Discover')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Restaurant/i })).toBeInTheDocument();
  });

  it('shows + Filter button instead of Filters heading', () => {
    renderHeader();
    expect(screen.queryByText('Filters')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
  });

  it('shows List / Map sub-nav for geo-capable types', () => {
    renderHeader({ objectType: 'restaurant', showMap: true });
    expect(screen.getByRole('navigation', { name: 'Discover view' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'List' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Map' })).toBeInTheDocument();
  });

  it('calls onMobileTabChange when Map tab is selected', () => {
    const { onMobileTabChange } = renderHeader({ mobileTab: 'list', showMap: true });
    fireEvent.click(screen.getByRole('button', { name: 'Map' }));
    expect(onMobileTabChange).toHaveBeenCalledWith('map');
  });

  it('hides List / Map sub-nav for non-geo types', () => {
    renderHeader({ objectType: 'book', showMap: false, showFilters: false });
    expect(screen.queryByRole('navigation', { name: 'Discover view' })).not.toBeInTheDocument();
  });

  it('hides sort when Map tab is active', () => {
    renderHeader({ mobileTab: 'map', showMap: true });
    expect(screen.queryByTestId('sort-select')).not.toBeInTheDocument();
  });

  it('shows sort on List tab', () => {
    renderHeader({ mobileTab: 'list', showMap: true });
    expect(screen.getByTestId('sort-select')).toBeInTheDocument();
  });
});
