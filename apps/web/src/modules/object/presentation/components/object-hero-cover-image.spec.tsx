/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';

import { ObjectHeroCoverImage } from './object-hero-cover-image';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    onError,
  }: {
    src: string;
    onError?: () => void;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test mock
    <img src={src} data-testid="hero-cover" onError={onError} alt="" />
  ),
}));

const SHOPIFY =
  'https://www.saturdaydumpling.com/cdn/shop/files/SDCo_Logo_01_RGB_1920_1080-03_a7dbffe0-238d-4532-b2f5-87915f9d5745.png?v=1686063213';

describe('ObjectHeroCoverImage', () => {
  it('loads modern CDN cover URLs directly first', () => {
    render(<ObjectHeroCoverImage coverImageUrl={SHOPIFY} />);
    expect(screen.getByTestId('hero-cover')).toHaveAttribute('src', SHOPIFY);
  });

  it('falls back to Hive proxy then hides cover on repeated errors', () => {
    render(<ObjectHeroCoverImage coverImageUrl={SHOPIFY} />);
    const img = screen.getByTestId('hero-cover');

    fireEvent.error(img);
    expect(img).toHaveAttribute(
      'src',
      `https://images.hive.blog/0x0/${SHOPIFY}`,
    );

    fireEvent.error(img);
    expect(screen.queryByTestId('hero-cover')).not.toBeInTheDocument();
  });
});
