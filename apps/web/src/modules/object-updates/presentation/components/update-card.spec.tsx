/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import type { ObjectUpdateFeedItemView } from '../../application/dto/object-updates-feed.dto';
import { UpdateCard } from './update-card';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock('@/config/odl-network-provider', () => ({
  useOdlCustomJsonId: () => 'waivio.mainnet',
}));

jest.mock('@/modules/auth', () => ({
  useHydrateWalletProvider: () => undefined,
  getWalletFacade: () => ({ broadcast: jest.fn() }),
}));

jest.mock('@/modules/notifications', () => ({
  awaitTrxConfirmation: jest.fn(),
}));

jest.mock('@/shared/infrastructure/query/refresh-after-broadcast', () => ({
  refreshAfterBroadcast: jest.fn(),
}));

jest.mock('@/shared/infrastructure/query/revalidate-after-broadcast.server', () => ({
  revalidateObjectAfterBroadcast: jest.fn(),
}));

jest.mock('./update-approval-status-block', () => ({
  UpdateApprovalStatusBlock: () => null,
}));

jest.mock('./update-vote-controls', () => ({
  UpdateVoteControls: () => null,
}));

jest.mock('./update-card-value', () => ({
  UpdateCardValue: () => null,
}));

jest.mock('@/modules/object/presentation/components/gallery-rank-trigger-button', () => ({
  GalleryRankTriggerButton: () => (
    <button type="button">Set gallery rank</button>
  ),
}));

jest.mock('@/shared/presentation', () => ({
  ObjectThumbnail: () => null,
  StatHoverTooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserAvatar: () => null,
}));

jest.mock('@/i18n/providers/i18n-provider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'en-US',
  }),
}));

function galleryItem(overrides: Partial<ObjectUpdateFeedItemView> = {}): ObjectUpdateFeedItemView {
  return {
    update_id: 'g1',
    object_id: 'obj1',
    update_type: UPDATE_TYPES.IMAGE_GALLERY_ITEM,
    creator: 'alice',
    creator_wobjects_weight: 10,
    locale: null,
    created_at_unix: 1_700_000_000,
    value_text: null,
    value_geo: null,
    value_json: { album: 'Photos', cid: 'bafyTest' },
    image_preview_urls: [],
    approve_percent: 80,
    for_vote_count: 1,
    against_vote_count: 0,
    for_preview_voters: [],
    against_preview_voters: [],
    viewer_vote: null,
    decisive_privileged_vote: null,
    rank_score: 5000,
    viewer_rank: null,
    ...overrides,
  };
}

describe('UpdateCard gallery rank', () => {
  it('shows rank button for imageGalleryItem without image previews', () => {
    render(
      <UpdateCard
        item={galleryItem({ image_preview_urls: [] })}
        showLocaleBadge={false}
        viewerUsername="bob"
      />,
    );

    expect(screen.getByRole('button', { name: 'Set gallery rank' })).toBeInTheDocument();
  });

  it('does not show rank button for non-gallery update types', () => {
    render(
      <UpdateCard
        item={galleryItem({ update_type: UPDATE_TYPES.NAME, value_text: 'Title' })}
        showLocaleBadge={false}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Set gallery rank' })).not.toBeInTheDocument();
  });
});
