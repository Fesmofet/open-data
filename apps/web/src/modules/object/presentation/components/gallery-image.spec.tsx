/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { GalleryImage } from './gallery-image';
import { GalleryImageFailedState } from './gallery-image-failed-state';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    onError,
    onLoad,
  }: {
    src: string;
    alt?: string;
    onError?: () => void;
    onLoad?: (event: { currentTarget: HTMLImageElement }) => void;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test mock
    <img
      src={src}
      alt={alt ?? ''}
      data-testid="gallery-image"
      onError={onError}
      onLoad={(event) => onLoad?.(event)}
    />
  ),
}));

jest.mock('@/i18n/providers/i18n-provider', () => ({
  useI18n: () => ({
    t: (key: string) =>
      key === 'gallery_image_failed_to_load'
        ? 'This image failed to load'
        : key,
  }),
}));

const BUSY_IPFS =
  'https://ipfs.busy.org/ipfs/QmQ2G2GCrBVmwAQ8J6RCKZRrsXWByWAB6NGNaS6hCGa7go';

describe('GalleryImageFailedState', () => {
  it('renders the failed-to-load message', () => {
    render(
      <div className="relative aspect-square">
        <GalleryImageFailedState message="This image failed to load" />
      </div>,
    );

    expect(screen.getByText('This image failed to load')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'This image failed to load' })).toBeInTheDocument();
  });
});

describe('GalleryImage', () => {
  it('proxies legacy ipfs.busy.org URLs for display', () => {
    render(
      <div className="relative aspect-square">
        <GalleryImage src={BUSY_IPFS} sizes="400px" />
      </div>,
    );

    expect(screen.getByTestId('gallery-image')).toHaveAttribute(
      'src',
      `https://images.hive.blog/0x0/${BUSY_IPFS}`,
    );
  });

  it('falls back to raw URL when proxied primary fails', () => {
    const raw = 'https://cdn.example.com/product.jpg';
    render(
      <div className="relative aspect-square">
        <GalleryImage src={raw} sizes="400px" />
      </div>,
    );

    const img = screen.getByTestId('gallery-image');
    expect(img).toHaveAttribute(
      'src',
      `https://images.hive.blog/0x0/${raw}`,
    );

    fireEvent.error(img);
    expect(img).toHaveAttribute('src', raw);
  });

  it('falls back to preview proxy then failed state on repeated errors', () => {
    render(
      <div className="relative aspect-square">
        <GalleryImage src={BUSY_IPFS} sizes="400px" />
      </div>,
    );

    const img = screen.getByTestId('gallery-image');

    fireEvent.error(img);
    expect(img).toHaveAttribute('src', BUSY_IPFS);

    fireEvent.error(img);
    expect(img.getAttribute('src')).toMatch(
      /^https:\/\/images\.hive\.blog\/800x600\/https:\/\/images\.hive\.blog\/p\//,
    );

    fireEvent.error(img);
    expect(screen.getByText('This image failed to load')).toBeInTheDocument();
    expect(screen.queryByTestId('gallery-image')).not.toBeInTheDocument();
  });
});
