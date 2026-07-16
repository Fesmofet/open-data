import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import type { ObjectPageViewModel } from '../../domain/object-page.types';
import { objectPageModelToPreviewFields } from './object-page-to-preview-fields';

function minimalModel(
  overrides: Partial<ObjectPageViewModel> = {},
): ObjectPageViewModel {
  return {
    objectId: 'abc-my-shop',
    title: 'My Shop',
    subtitleTitle: null,
    avatarUrl: 'https://cdn.example/avatar.jpg',
    coverImageUrl: null,
    kindLabel: 'shop',
    tagline: null,
    displayWeightLabel: null,
    objectTypeKey: 'shop',
    objectType: 'shop',
    defaultLanding: { kind: 'hostContent' },
    listItems: [],
    listItemsSortCustom: null,
    pageContent: null,
    legalText: null,
    descriptionContent: 'A great neighborhood shop.',
    previewGallery: [],
    galleryAlbums: [],
    onChainGalleryAlbumNames: [],
    rating01To5: null,
    primaryTabs: [],
    feedSubTabs: [],
    leftRailBlocks: [
      {
        kind: 'name',
        headingLabel: 'Name',
        text: 'My Shop',
      },
    ],
    tagCategoryNames: [],
    rightRelated: [],
    rightSimilar: [],
    rightAddOn: [],
    rightRelatedHasMore: false,
    rightSimilarHasMore: false,
    rightAddOnHasMore: false,
    hasAdministrativeAuthority: false,
    hasOwnershipAuthority: false,
    isFollowing: false,
    viewerBell: false,
    updateTypeCounts: {},
    administrativeAuthorityCount: 0,
    ownershipAuthorityCount: 0,
    seo: null,
    ...overrides,
  };
}

describe('objectPageModelToPreviewFields', () => {
  it('maps title, description, and avatar image', () => {
    const fields = objectPageModelToPreviewFields(minimalModel());

    expect(fields.find((f) => f.updateType === UPDATE_TYPES.NAME)?.value).toBe(
      'My Shop',
    );
    expect(
      fields.find((f) => f.updateType === UPDATE_TYPES.DESCRIPTION)?.value,
    ).toBe('A great neighborhood shop.');
    expect(fields.find((f) => f.updateType === UPDATE_TYPES.IMAGE)?.value).toEqual(
      { url: 'https://cdn.example/avatar.jpg' },
    );
  });

  it('maps related refs for completeness relations', () => {
    const fields = objectPageModelToPreviewFields(
      minimalModel({
        rightRelated: [
          {
            objectId: 'ref-1',
            title: 'Related',
            imageSrc: null,
            objectType: 'shop',
          },
        ],
      }),
    );

    expect(
      fields.filter((f) => f.updateType === UPDATE_TYPES.IS_RELATED_TO),
    ).toHaveLength(1);
    expect(
      fields.find((f) => f.updateType === UPDATE_TYPES.IS_RELATED_TO)?.value,
    ).toBe('ref-1');
  });
});
