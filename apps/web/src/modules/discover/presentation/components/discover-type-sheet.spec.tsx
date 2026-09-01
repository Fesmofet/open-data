/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';
import type { LocaleId, Messages } from '@/i18n/types';

import { DiscoverTypeSheet } from './discover-type-sheet';

const navigateInstant = jest.fn();

jest.mock('@/shared/presentation', () => ({
  ModalShell: ({
    open,
    onClose,
    children,
    header,
  }: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    header?: React.ReactNode;
  }) =>
    open ? (
      <div role="dialog">
        {header}
        {children}
        <button type="button" aria-label="Close backdrop" onClick={onClose}>
          Backdrop
        </button>
      </div>
    ) : null,
  useInstantNavigation: () => ({ navigateInstant }),
}));

jest.mock('../../domain/discover-type-cookie', () => ({
  writeDiscoverObjectTypeCookie: jest.fn(),
}));

const messages = {
  discover_page_title: 'Discover',
  discover_select_type: 'Select type',
  discover_search_object_types: 'Search object types',
  discover_objects_menu: 'Objects',
  discover_users_menu: 'Users',
  discover_all_users: 'All users',
  discover_no_results: 'No results found.',
} as Messages;

function renderSheet(
  props: Partial<React.ComponentProps<typeof DiscoverTypeSheet>> = {},
) {
  const onClose = jest.fn();
  render(
    <I18nProvider locale={'en-US' as LocaleId} messages={messages}>
      <DiscoverTypeSheet
        open
        onClose={onClose}
        usersMode={false}
        objectType="restaurant"
        q="sushi"
        sort="newest"
        {...props}
      />
    </I18nProvider>,
  );
  return { onClose };
}

describe('DiscoverTypeSheet', () => {
  beforeEach(() => {
    navigateInstant.mockClear();
  });

  it('navigates to selected type preserving query and sort', () => {
    renderSheet();
    fireEvent.click(screen.getByRole('option', { name: 'Book' }));
    expect(navigateInstant).toHaveBeenCalledWith({
      href: '/discover?type=book&q=sushi&sort=newest',
      method: 'replace',
      scroll: false,
    });
  });

  it('marks only the active type as selected', () => {
    renderSheet({ objectType: 'restaurant' });
    const selected = screen.getAllByRole('option', { selected: true });
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent('Restaurant');
  });

  it('filters object types by partial label match', () => {
    renderSheet();
    fireEvent.change(screen.getByPlaceholderText('Search object types'), {
      target: { value: 'offered' },
    });
    expect(screen.getByRole('option', { name: 'Service offered' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Restaurant' })).not.toBeInTheDocument();
  });

  it('shows empty state when search matches no types', () => {
    renderSheet();
    fireEvent.change(screen.getByPlaceholderText('Search object types'), {
      target: { value: 'zzz' },
    });
    expect(screen.getByText('No results found.')).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Restaurant' })).not.toBeInTheDocument();
  });

  it('closes without navigation when backdrop is clicked', () => {
    const { onClose } = renderSheet({ objectType: 'restaurant' });
    fireEvent.click(screen.getByRole('button', { name: 'Close backdrop' }));
    expect(onClose).toHaveBeenCalled();
    expect(navigateInstant).not.toHaveBeenCalled();
  });
});
