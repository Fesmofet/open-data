/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

const mockUseHorizontalTabOverflow = jest.fn();

jest.mock('./use-horizontal-tab-overflow', () => ({
  useHorizontalTabOverflow: (...args: unknown[]) => mockUseHorizontalTabOverflow(...args),
}));

import { HorizontalTabNavWithOverflow } from './horizontal-tab-nav-with-overflow';

const items = [
  { id: 'details', active: true, label: 'Details', onSelect: jest.fn() },
  { id: 'reviews', active: false, label: 'Reviews', onSelect: jest.fn() },
  { id: 'gallery', active: false, label: 'Gallery', onSelect: jest.fn() },
  { id: 'updates', active: false, label: 'Updates', onSelect: jest.fn() },
  { id: 'experts', active: false, label: 'Experts', onSelect: jest.fn() },
];

function overflowMock() {
  return {
    rowRef: () => undefined,
    setTabRef: () => undefined,
    overflowIndices: [3, 4],
    hasOverflow: true,
    hasMeasured: true,
  };
}

function renderNav() {
  return render(
    <HorizontalTabNavWithOverflow
      items={items}
      activeIndex={0}
      ariaLabel="Object sections"
      moreLabel="More"
      moreMenuAriaLabel="More sections"
    />,
  );
}

describe('HorizontalTabNavWithOverflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHorizontalTabOverflow.mockImplementation(overflowMock);
  });

  it('renders all tab labels in the DOM for SSR-first paint', () => {
    mockUseHorizontalTabOverflow.mockReturnValue({
      rowRef: () => undefined,
      setTabRef: () => undefined,
      overflowIndices: [],
      hasOverflow: false,
      hasMeasured: false,
    });

    renderNav();

    expect(screen.getByRole('button', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reviews' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gallery' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Updates' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Experts' })).toBeInTheDocument();
  });

  it('opens a menu with overflow tabs when More is clicked', () => {
    renderNav();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'More sections' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Updates' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Experts' })).toBeInTheDocument();
  });

  it('calls onSelect and closes the menu when an overflow item is chosen', () => {
    renderNav();

    fireEvent.click(screen.getByRole('button', { name: 'More sections' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Experts' }));

    expect(items[4].onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
