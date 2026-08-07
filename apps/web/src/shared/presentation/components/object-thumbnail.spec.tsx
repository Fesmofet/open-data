/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';

import { AVATAR_PLACEHOLDER_SRC } from '../avatar/resolve-avatar-url';
import { ObjectThumbnail } from './object-thumbnail';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    onError,
  }: {
    src: string;
    alt?: string;
    onError?: () => void;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test mock
    <img src={src} alt={alt ?? ''} data-testid="object-thumb" onError={onError} />
  ),
}));

const STEEMIT = 'https://steemitimages.com/u/neoxian/avatar/large';
const HIVE = 'https://images.hive.blog/u/neoxian/avatar/large';

describe('ObjectThumbnail', () => {
  it('renders normalized primary URL for steemitimages avatars', () => {
    render(<ObjectThumbnail src={STEEMIT} size={40} />);
    expect(screen.getByTestId('object-thumb')).toHaveAttribute('src', HIVE);
  });

  it('falls back to preview proxy then placeholder on repeated errors', () => {
    render(<ObjectThumbnail src={STEEMIT} size={40} />);
    const img = screen.getByTestId('object-thumb');

    fireEvent.error(img);
    expect(img.getAttribute('src')).toMatch(
      /^https:\/\/images\.hive\.blog\/800x600\/https:\/\/images\.hive\.blog\/p\//,
    );

    fireEvent.error(img);
    expect(img).toHaveAttribute('src', AVATAR_PLACEHOLDER_SRC);
  });

  it('shows placeholder when src is missing', () => {
    render(<ObjectThumbnail src={null} size={40} />);
    expect(screen.getByTestId('object-thumb')).toHaveAttribute(
      'src',
      AVATAR_PLACEHOLDER_SRC,
    );
  });
});
