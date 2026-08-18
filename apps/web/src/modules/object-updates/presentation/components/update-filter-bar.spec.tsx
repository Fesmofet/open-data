/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

const navigateInstant = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/object/test/updates',
  useSearchParams: () => new URLSearchParams('sort=recency'),
}));

jest.mock('@/shared/presentation', () => ({
  useInstantNavigation: () => ({ navigateInstant }),
}));

import { ObjectUpdatesFilterBar } from './update-filter-bar';

const messages = {
  object_updates_all_locales: 'All locales',
  object_updates_filter_locale: 'Interface language',
  object_updates_all_types: 'All updates',
  object_updates_sort_recency: 'Recency',
  object_updates_sort_approval: 'Approval',
};

function renderBar(props: ComponentProps<typeof ObjectUpdatesFilterBar>) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <ObjectUpdatesFilterBar {...props} />
    </I18nProvider>,
  );
}

function getLocaleFilterButton() {
  return screen.getByRole('button', { name: 'Interface language' });
}

describe('ObjectUpdatesFilterBar locale filter', () => {
  beforeEach(() => {
    navigateInstant.mockClear();
  });

  it('shows All locales as the default closed label', () => {
    renderBar({
      typeOptions: [{ value: 'name', label: 'Name' }],
      showLocaleFilter: true,
      localeOptions: ['en-US'],
    });
    expect(getLocaleFilterButton()).toHaveTextContent('All locales');
  });

  it('matches All updates closed styling on the locale filter', () => {
    renderBar({
      typeOptions: [{ value: 'name', label: 'Name' }],
      showLocaleFilter: true,
      localeOptions: ['en-US'],
    });
    const localeButton = getLocaleFilterButton();
    const typeButton = screen.getByRole('button', { name: 'All updates' });
    expect(localeButton.className).toBe(typeButton.className);
  });

  it('lists only passed localeOptions when opened', () => {
    renderBar({
      typeOptions: [{ value: 'name', label: 'Name' }],
      showLocaleFilter: true,
      localeOptions: ['ko-KR', 'en-US'],
    });
    fireEvent.click(getLocaleFilterButton());
    expect(screen.getByRole('option', { name: 'All locales' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'ko-KR' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'en-US' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'fr-FR' })).not.toBeInTheDocument();
  });

  it('shows orphan active locale from controlled filters', () => {
    renderBar({
      mode: 'controlled',
      filters: { sort: 'recency', update_type: undefined, locale: 'ko-KR' },
      onFiltersChange: jest.fn(),
      typeOptions: [{ value: 'name', label: 'Name' }],
      showLocaleFilter: true,
      localeOptions: ['en-US'],
    });
    expect(getLocaleFilterButton()).toHaveTextContent('ko-KR');
    fireEvent.click(getLocaleFilterButton());
    expect(screen.getByRole('option', { name: 'ko-KR' })).toBeInTheDocument();
  });

  it('clears locale filter when All locales is selected in controlled mode', () => {
    const onFiltersChange = jest.fn();
    renderBar({
      mode: 'controlled',
      filters: { sort: 'recency', update_type: undefined, locale: 'en-US' },
      onFiltersChange,
      typeOptions: [{ value: 'name', label: 'Name' }],
      showLocaleFilter: true,
      localeOptions: ['en-US'],
    });
    fireEvent.click(getLocaleFilterButton());
    fireEvent.click(screen.getByRole('option', { name: 'All locales' }));
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ locale: undefined }),
    );
  });

  it('removes locale search param when All locales is selected in URL mode', () => {
    renderBar({
      typeOptions: [{ value: 'name', label: 'Name' }],
      showLocaleFilter: true,
      localeOptions: ['en-US'],
    });
    fireEvent.click(getLocaleFilterButton());
    fireEvent.click(screen.getByRole('option', { name: 'All locales' }));
    expect(navigateInstant).toHaveBeenCalledWith(
      expect.objectContaining({ href: '/object/test/updates?sort=recency' }),
    );
  });
});
