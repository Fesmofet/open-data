/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

import type { ProjectedGalleryPhotoView } from '../../domain/object-page.types';

jest.mock('./gallery-image', () => ({
  GalleryImage: ({
    src,
    className,
    onLoad,
  }: {
    src: string;
    className?: string;
    onLoad?: (event: { currentTarget: HTMLImageElement }) => void;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-testid="gallery-image"
      src={src}
      className={className}
      alt=""
      onLoad={(event) => {
        Object.defineProperty(event.currentTarget, 'naturalWidth', { value: 800 });
        Object.defineProperty(event.currentTarget, 'naturalHeight', { value: 800 });
        onLoad?.(event);
      }}
    />
  ),
}));

import { ObjectGalleryCarousel } from './object-gallery-carousel';

const messages = {
  object_detail_gallery_prev: 'Previous photo',
  object_detail_gallery_next: 'Next photo',
  gallery: 'Gallery',
};

const photos: ProjectedGalleryPhotoView[] = [
  { url: 'https://example.com/photo-1.jpg', rankScore: null, isAvatar: false },
  { url: 'https://example.com/photo-2.jpg', rankScore: null, isAvatar: false },
];

function renderCarousel(previewImageUrl: string | null = null) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <ObjectGalleryCarousel photos={photos} previewImageUrl={previewImageUrl} />
    </I18nProvider>,
  );
}

function frameAspectRatio(): string {
  const frame = screen.getByTestId('gallery-carousel-frame');
  return frame.style.aspectRatio;
}

describe('ObjectGalleryCarousel preview mode', () => {
  it('keeps prev/next controls mounted and disabled during preview', () => {
    renderCarousel('https://example.com/avatar.jpg');

    expect(screen.getByRole('button', { name: 'Previous photo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next photo' })).toBeDisabled();
  });

  it('uses object-contain for preview images', () => {
    renderCarousel('https://example.com/avatar.jpg');

    expect(screen.getByTestId('gallery-image')).toHaveClass('object-contain');
  });

  it('uses object-contain before gallery photo aspect is known', () => {
    renderCarousel(null);

    expect(screen.getByTestId('gallery-image')).toHaveClass('object-contain');
  });

  it('uses object-cover after gallery photo aspect is known', () => {
    renderCarousel(null);

    fireEvent.load(screen.getByTestId('gallery-image'));

    expect(screen.getByTestId('gallery-image')).toHaveClass('object-cover');
    expect(frameAspectRatio()).toBe('1');
  });

  it('does not change frame aspect ratio when preview image loads', () => {
    renderCarousel('https://example.com/avatar.jpg');

    const aspectBeforeLoad = frameAspectRatio();
    fireEvent.load(screen.getByTestId('gallery-image'));

    expect(frameAspectRatio()).toBe(aspectBeforeLoad);
  });
});
