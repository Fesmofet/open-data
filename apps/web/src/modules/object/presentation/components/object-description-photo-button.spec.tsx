/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

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
        Object.defineProperty(event.currentTarget, 'naturalWidth', { value: 600 });
        Object.defineProperty(event.currentTarget, 'naturalHeight', { value: 900 });
        onLoad?.(event);
      }}
    />
  ),
}));

import { ObjectDescriptionPhotoButton } from './object-description-photo-button';

function frameAspectRatio(): string {
  const frame = screen.getByTestId('description-photo-frame');
  return frame.style.aspectRatio;
}

describe('ObjectDescriptionPhotoButton', () => {
  it('uses object-contain for description photos', () => {
    render(
      <ObjectDescriptionPhotoButton
        url="https://example.com/book-cover.jpg"
        interactive={false}
      />,
    );

    expect(screen.getByTestId('gallery-image')).toHaveClass('object-contain');
  });

  it('uses natural portrait aspect ratio after image load', () => {
    render(
      <ObjectDescriptionPhotoButton
        url="https://example.com/book-cover.jpg"
        interactive={false}
      />,
    );

    fireEvent.load(screen.getByTestId('gallery-image'));

    expect(frameAspectRatio()).toBe(String(600 / 900));
  });

  it('renders as a button when interactive', () => {
    render(
      <ObjectDescriptionPhotoButton
        url="https://example.com/book-cover.jpg"
        interactive
        ariaLabel="Open gallery"
        onClick={() => undefined}
      />,
    );

    expect(screen.getByRole('button', { name: 'Open gallery' })).toBeInTheDocument();
  });
});
