/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { LocaleId, Messages } from '@/i18n/types';

import { TopNav } from './top-nav';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/',
}));

jest.mock('../../infrastructure/search.client', () => ({
  fetchSearchResults: jest.fn(),
  fetchSearchCounts: jest.fn(),
}));

jest.mock('./header-actions', () => ({
  HeaderActions: () => <div data-testid="header-actions" />,
}));

jest.mock('./search-dropdown', () => ({
  EMPTY_RESULTS: { objects: [], users: [] },
  SearchDropdown: () => null,
}));

const { fetchSearchResults, fetchSearchCounts } = jest.requireMock(
  '../../infrastructure/search.client',
) as {
  fetchSearchResults: jest.Mock;
  fetchSearchCounts: jest.Mock;
};

const messages = {
  app_header_brand_aria: 'Home',
  app_header_clear_search: 'Clear',
  app_header_close_search_aria: 'Close search',
  app_header_open_search_aria: 'Open search',
  app_header_search_loading: 'Searching…',
  search_discover_chips_aria: 'Discover filters',
  search_empty_state: 'No results',
  search_placeholder: 'What are you looking for?',
  search_section_objects: 'Objects',
  search_section_users: 'Users',
  search_tab_users: 'Users',
  search_user_following: 'Following',
  stat_user_expertise_tooltip: 'Expertise',
  stat_user_followers_tooltip: 'Followers',
} as Messages;

function renderTopNav() {
  render(
    <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
      <TopNav user={null} />
    </I18nProvider>,
  );
}

function getSearchInput() {
  return screen.getByPlaceholderText('What are you looking for?');
}

function getMobileSearchToggle() {
  return screen.getByRole('button', { name: /search/i });
}

function getDesktopCloseButton() {
  return screen.getAllByRole('button', { name: 'Close search' }).find((btn) =>
    btn.className.includes('lg:inline-flex'),
  );
}

function getMobileCloseToggle() {
  return screen.getAllByRole('button', { name: 'Close search' }).find((btn) =>
    btn.className.includes('lg:hidden'),
  );
}

function getSearchShell() {
  return getSearchInput().closest('.app-header-search-surface');
}

describe('TopNav search Clear vs Close', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchSearchResults.mockResolvedValue({ objects: [], users: [] });
    fetchSearchCounts.mockResolvedValue({ objectTypes: [], users: 0 });
  });

  it('shows Clear when typing and clears query without closing search', async () => {
    renderTopNav();
    const input = getSearchInput();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'agassiz' } });

    const clearButton = screen.getByRole('button', { name: 'Clear' });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
    expect(input).toBeInTheDocument();
    expect(getDesktopCloseButton()).toBeDefined();
  });

  it('desktop Close X inside the bar exits search and clears the query', async () => {
    renderTopNav();
    const input = getSearchInput();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'agassiz' } });

    const desktopClose = getDesktopCloseButton();
    expect(desktopClose).toBeDefined();

    fireEvent.click(desktopClose!);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
    expect(document.activeElement).not.toBe(input);
  });

  it('mobile toggle closes expanded search', async () => {
    renderTopNav();

    fireEvent.click(getMobileSearchToggle());
    expect(getSearchShell()?.className).toContain('block');

    const input = getSearchInput();
    fireEvent.change(input, { target: { value: 'agassiz' } });

    const mobileToggle = getMobileCloseToggle();
    expect(mobileToggle).toBeDefined();

    fireEvent.click(mobileToggle!);

    await waitFor(() => {
      expect(getMobileSearchToggle()).toHaveAttribute('aria-expanded', 'false');
    });
    expect(getSearchShell()?.className).toContain('hidden lg:block');
  });
});
