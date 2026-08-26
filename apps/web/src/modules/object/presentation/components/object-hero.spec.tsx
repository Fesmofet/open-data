/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

jest.mock('@/i18n/providers/i18n-provider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/modules/object-updates/presentation/components/add-update-modal', () => ({
  AddUpdateModal: () => null,
}));

jest.mock('@/shared/presentation', () => ({
  ObjectThumbnail: () => null,
  OptimisticNavLink: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

jest.mock('@/shared/presentation/layout', () => ({
  ShellFullBleedBand: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ShellInset: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/shell-mode', () => ({
  shouldHideHeroOnDesktop: () => false,
  useShellMode: () => ({ resolvedMode: 'default' }),
  HIDDEN_ON_DESKTOP_CLASS: 'hidden',
}));

jest.mock('./object-hero-cover-image', () => ({
  ObjectHeroCoverImage: () => null,
}));

import { ObjectHero } from './object-hero';

const baseProps = {
  title: 'Good Co.',
  subtitleTitle: null,
  avatarUrl: null,
  coverImageUrl: null,
  tagline: null,
  displayWeightLabel: '2.421',
  kindLabel: 'restaurant',
  isEditMode: false,
  isFollowing: false,
  isBell: false,
  isFavorite: false,
  onToggleEdit: () => undefined,
  onFollowToggle: () => undefined,
  onBellToggle: () => undefined,
  onFavoriteToggle: () => undefined,
  primaryNav: null,
};

describe('ObjectHero status badge', () => {
  it('links permanently closed label to status updates when href is set', () => {
    render(
      <ObjectHero
        {...baseProps}
        statusBadgeLabel="Permanently closed"
        statusUpdatesHref="/object/rest-1/updates?update_type=status"
      />,
    );

    const link = screen.getByRole('link', { name: 'Permanently closed' });
    expect(link.getAttribute('href')).toBe('/object/rest-1/updates?update_type=status');
    expect(screen.getByText('restaurant')).toBeTruthy();
    expect(screen.getByText('2.421')).toBeTruthy();
  });

  it('renders non-linked badge when href is absent', () => {
    render(
      <ObjectHero
        {...baseProps}
        statusBadgeLabel="Discontinued"
      />,
    );

    expect(screen.getByText('Discontinued')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Discontinued' })).toBeNull();
  });
});
