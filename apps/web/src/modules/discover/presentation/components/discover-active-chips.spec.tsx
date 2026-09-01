/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { LocaleId, Messages } from '@/i18n/types';

import { DiscoverActiveChips } from './discover-active-chips';

const navigateInstant = jest.fn();

jest.mock('@/shared/presentation', () => ({
  useInstantNavigation: () => ({ navigateInstant }),
}));

const messages = {
  discover_active_filters: '{count} active',
  discover_clear_all: 'Clear all',
  discover_active_search_chip: 'Search: {query}',
  discover_remove_search: 'Remove search {query}',
  discover_remove_filter: 'Remove filter {tag}',
  discover_map_area_filter: 'Map area',
  discover_remove_map_area: 'Remove map area',
} as Messages;

const SAMPLE_BOX = { swLng: -123.2, swLat: 49.1, neLng: -123.0, neLat: 49.3 };

describe('DiscoverActiveChips map area', () => {
  beforeEach(() => {
    navigateInstant.mockClear();
  });

  it('clears only the map area while preserving other filters', () => {
    render(
      <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
        <DiscoverActiveChips
          usersMode={false}
          objectType="restaurant"
          q="sushi"
          tags={['Cuisine:Japanese']}
          sort="newest"
          box={SAMPLE_BOX}
          map={null}
        />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove map area' }));

    expect(navigateInstant).toHaveBeenCalledTimes(1);
    expect(navigateInstant).toHaveBeenCalledWith({
      href: '/discover?type=restaurant&q=sushi&tags=Cuisine%3AJapanese&sort=newest',
      method: 'replace',
      scroll: false,
    });
  });
});
