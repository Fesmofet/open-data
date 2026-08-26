/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

import { ObjectIngredientsLeftRailSection } from './object-ingredients-left-rail-section';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const messages: Record<string, string> = {
  show_all_ingredients: 'Show all {count} ingredients',
  object_updates_show_less: 'Show less',
};

function renderSection(items: string[]) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <ObjectIngredientsLeftRailSection
        headingLabel="Ingredients"
        items={items}
        objectTypeKey="recipe"
      />
    </I18nProvider>,
  );
}

describe('ObjectIngredientsLeftRailSection', () => {
  it('shows first five ingredients and expands on Show all', () => {
    const items = [
      'Napa Cabbage — 8 lbs 8 oz',
      'Sea Salt',
      'Water',
      'Glutinous Rice Flour',
      'Fish Sauce',
      'Garlic',
      'Ginger',
    ];
    renderSection(items);

    expect(screen.getByText('Napa Cabbage — 8 lbs 8 oz')).toBeInTheDocument();
    expect(screen.getByText('Fish Sauce')).toBeInTheDocument();
    expect(screen.queryByText('Garlic')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show all 7 ingredients' }));

    expect(screen.getByText('Garlic')).toBeInTheDocument();
    expect(screen.getByText('Ginger')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });

  it('links ingredients to discover search with cleaned query', () => {
    renderSection(['Sea Salt']);

    const link = screen.getByRole('link', { name: 'Sea Salt' });
    expect(link.getAttribute('href')).toMatch(/\/discover\?type=recipe&q=Sea(\+|%20)Salt/);
  });

  it('cleans emoji and amounts from discover href while keeping display text', () => {
    renderSection(['🥬 8 lbs 8 oz Napa Cabbage (one large head)']);

    expect(
      screen.getByRole('link', { name: '🥬 8 lbs 8 oz Napa Cabbage (one large head)' }),
    ).toHaveAttribute('href', '/discover?type=recipe&q=Napa+Cabbage');
  });
});
