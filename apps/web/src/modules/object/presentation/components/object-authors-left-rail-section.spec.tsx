/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

jest.mock('@/shared/presentation', () => ({
  shouldUnoptimizeRemoteImage: () => true,
}));

import { ObjectAuthorsLeftRailSection } from './object-authors-left-rail-section';

const messages = {
  by_only: 'By',
};

function renderSection(
  items: { objectId: string; name: string; imageUrl: string | null }[],
) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <ObjectAuthorsLeftRailSection items={items} />
    </I18nProvider>,
  );
}

describe('ObjectAuthorsLeftRailSection', () => {
  it('renders By prefix on the first author only', () => {
    renderSection([
      { objectId: 'author-1', name: 'Author One', imageUrl: null },
      { objectId: 'author-2', name: 'Author Two', imageUrl: null },
    ]);

    expect(screen.getByText('By')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Author One' })).toHaveAttribute(
      'href',
      '/object/author-1',
    );
    expect(screen.getByRole('link', { name: 'Author Two' })).toHaveAttribute(
      'href',
      '/object/author-2',
    );
  });

  it('renders author avatar when imageUrl is set', () => {
    renderSection([
      {
        objectId: 'author-1',
        name: 'Author One',
        imageUrl: 'https://images.hive.blog/u/alice/avatar',
      },
    ]);

    expect(screen.getByRole('presentation', { hidden: true })).toHaveAttribute(
      'src',
      'https://images.hive.blog/u/alice/avatar',
    );
  });

  it('omits avatar when imageUrl is missing', () => {
    renderSection([{ objectId: 'author-1', name: 'Author One', imageUrl: null }]);

    expect(screen.queryByRole('presentation', { hidden: true })).not.toBeInTheDocument();
  });
});
