/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

import { ObjectCategoryLeftRailSection } from './object-category-left-rail-section';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mockUsePathname = jest.fn(() => '/object/obj-1');
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockSearchParams,
}));

const messages: Record<string, string> = {
  show_more: 'Show more',
  object_updates_show_less: 'Show less',
};

function renderSection(names: string[], activeCategoryName: string | null = null) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <ObjectCategoryLeftRailSection
        objectId="obj-1"
        headingLabel="Categories"
        names={names}
        activeCategoryName={activeCategoryName}
      />
    </I18nProvider>,
  );
}

describe('ObjectCategoryLeftRailSection', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/object/obj-1');
    for (const key of [...mockSearchParams.keys()]) {
      mockSearchParams.delete(key);
    }
  });

  it('shows first two names and expands on Show more', () => {
    renderSection(['A', 'B', 'C', 'D']);

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText('C')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));

    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });

  it('links to the category feed path', () => {
    renderSection(['Active Skirts']);

    const link = screen.getByRole('link', { name: 'Active Skirts' });
    expect(link).toHaveAttribute(
      'href',
      '/object/obj-1/category/Active%20Skirts',
    );
  });

  it('marks the active category from visible category path', () => {
    mockUsePathname.mockReturnValue('/object/obj-1/category/Active%20Skirts');
    renderSection(['Active Skirts', 'Other']);

    const activeLink = screen.getByRole('link', { name: 'Active Skirts' });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
    expect(activeLink).toHaveClass('object-category-left-rail-link--active');
    expect(screen.getByRole('link', { name: 'Other' })).not.toHaveAttribute('aria-current');
  });

  it('marks the active category from activeCategoryName prop', () => {
    mockUsePathname.mockReturnValue('/object/obj-1');
    renderSection(['Clothing', 'Other'], 'Clothing');

    const activeLink = screen.getByRole('link', { name: 'Clothing' });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
    expect(activeLink).toHaveClass('object-category-left-rail-link--active');
  });

  it('marks the active category from proxy category_name query param', () => {
    mockUsePathname.mockReturnValue('/object/obj-1');
    mockSearchParams.set('tab', 'category');
    mockSearchParams.set('category_name', encodeURIComponent('Clothing'));
    renderSection(['Clothing', 'Other']);

    const activeLink = screen.getByRole('link', { name: 'Clothing' });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
    expect(activeLink).toHaveClass('object-category-left-rail-link--active');
  });
});
