/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { GalleryRankTriggerButton } from './gallery-rank-trigger-button';

jest.mock('./gallery-rank-modal', () => ({
  GalleryRankModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="gallery-rank-modal" /> : null,
}));

jest.mock('@/i18n/providers/i18n-provider', () => ({
  useI18n: () => ({
    t: (key: string) => (key === 'gallery_rank_set' ? 'Set gallery rank' : key),
  }),
}));

describe('GalleryRankTriggerButton', () => {
  it('opens modal on click when logged in', () => {
    render(
      <GalleryRankTriggerButton
        variant="card"
        updateId="u1"
        objectId="obj1"
        rankScore={7000}
        viewerRank={null}
        viewerUsername="alice"
      />,
    );

    expect(screen.queryByTestId('gallery-rank-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Set gallery rank/ }));
    expect(screen.getByTestId('gallery-rank-modal')).toBeInTheDocument();
  });

  it('calls onRequireLogin instead of opening modal for guest', () => {
    const onRequireLogin = jest.fn();
    render(
      <GalleryRankTriggerButton
        variant="card"
        updateId="u1"
        objectId="obj1"
        rankScore={7000}
        viewerRank={null}
        onRequireLogin={onRequireLogin}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Set gallery rank/ }));
    expect(onRequireLogin).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('gallery-rank-modal')).not.toBeInTheDocument();
  });
});
