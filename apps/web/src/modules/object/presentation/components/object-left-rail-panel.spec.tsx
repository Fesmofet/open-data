/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

jest.mock('@/i18n/providers/i18n-provider', () => ({
  useI18n: () => ({
    t: (key: string) =>
      ({
        object_status_permanently_closed: 'Permanently closed',
        object_status_closed_location_body: 'This location is no longer operating.',
        object_status_suggest_correction: 'Suggest a correction',
        object_edit_add_update: 'Add update',
      })[key] ?? key,
    locale: 'en-US',
  }),
}));

jest.mock('@/modules/object-updates/presentation/components/add-update-modal', () => ({
  AddUpdateModal: () => null,
}));

jest.mock('./object-geo-preview', () => ({
  ObjectGeoPreview: () => null,
}));

jest.mock('./object-gallery-carousel', () => ({
  ObjectGalleryCarousel: () => null,
}));

jest.mock('./object-menu-items-static', () => ({
  ObjectMenuItemsStatic: () => null,
}));

jest.mock('./object-options-section', () => ({
  ObjectOptionsSection: () => null,
}));

jest.mock('./object-tags-left-rail-section', () => ({
  ObjectTagsLeftRailSection: () => null,
}));

jest.mock('./object-category-left-rail-section', () => ({
  ObjectCategoryLeftRailSection: () => null,
}));

jest.mock('./object-authors-left-rail-section', () => ({
  ObjectAuthorsLeftRailSection: () => null,
}));

jest.mock('./object-feature-list-left-rail-section', () => ({
  ObjectFeatureListLeftRailSection: () => null,
}));

jest.mock('./star-rating', () => ({
  StarRating: () => null,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

jest.mock('@/shared/presentation', () => ({
  shouldUnoptimizeRemoteImage: () => false,
  OptimisticNavLink: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

import { ObjectLeftRailPanel } from './object-left-rail-panel';

describe('ObjectLeftRailPanel closed venue status', () => {
  it('renders permanently closed notice with suggest correction link', () => {
    render(
      <ObjectLeftRailPanel
        blocks={[
          {
            kind: 'status',
            headingLabel: 'Status',
            status: 'closed',
          },
        ]}
        objectTypeKey="restaurant"
        objectId="rest-1"
        statusUpdatesHref="/object/rest-1/updates?update_type=status"
      />,
    );

    expect(screen.getByText('Permanently closed')).toBeTruthy();
    expect(screen.getByText('This location is no longer operating.')).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Suggest a correction' });
    expect(link.getAttribute('href')).toBe('/object/rest-1/updates?update_type=status');
  });

  it('does not render notice for active restaurant without status block', () => {
    render(
      <ObjectLeftRailPanel
        blocks={[{ kind: 'address', headingLabel: 'Address', text: '123 Main St' }]}
        objectTypeKey="restaurant"
        objectId="rest-1"
      />,
    );

    expect(screen.queryByText('Permanently closed')).toBeNull();
  });
});
