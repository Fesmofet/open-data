/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import type { ProjectedMenuItem } from '../../domain/projected-menu-item.types';

jest.mock('@/shared/presentation', () => ({
  shouldUnoptimizeRemoteImage: () => false,
  OptimisticNavLink: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { ObjectMenuItemsStatic } from './object-menu-items-static';

describe('ObjectMenuItemsStatic', () => {
  it('renders menu item linking to in-host nested object with ?path= query param', () => {
    const items: ProjectedMenuItem[] = [
      {
        displayTitle: 'Food Menu',
        link_to_object: 'tle-menu',
        object_type: 'list',
        style: 'default',
      },
    ];

    render(
      <ObjectMenuItemsStatic
        items={items}
        hostObjectId="ehk-catch-kitchen-bar"
      />,
    );

    const link = screen.getByRole('link', { name: 'Food Menu' });
    expect(link).toHaveAttribute(
      'href',
      '/object/ehk-catch-kitchen-bar?path=tle-menu',
    );
  });

  it('renders external web link with target blank', () => {
    const items: ProjectedMenuItem[] = [
      {
        displayTitle: 'Online Ordering',
        link_to_web: 'https://example.com/order',
        style: 'highlight',
      },
    ];

    render(
      <ObjectMenuItemsStatic
        items={items}
        hostObjectId="ehk-catch-kitchen-bar"
      />,
    );

    const link = screen.getByRole('link', { name: 'Online Ordering' });
    expect(link).toHaveAttribute('href', 'https://example.com/order');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders non-in-host object links directly to target object', () => {
    const items: ProjectedMenuItem[] = [
      {
        displayTitle: 'Partner Venue',
        link_to_object: 'other-venue',
        object_type: 'restaurant',
        style: 'default',
      },
    ];

    render(
      <ObjectMenuItemsStatic
        items={items}
        hostObjectId="ehk-catch-kitchen-bar"
      />,
    );

    const link = screen.getByRole('link', { name: 'Partner Venue' });
    expect(link).toHaveAttribute('href', '/object/other-venue');
  });
});
