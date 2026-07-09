import { projectedObjectWithCountsToPageModel } from './projected-object-to-page-model';
import type { ProjectedObjectWithCountsView } from './object-resolve.types';

describe('projectedObjectWithCountsToPageModel gallery', () => {
  it('maps root-level galleryAlbums and previewGallery from resolve payload', () => {
    const api: ProjectedObjectWithCountsView = {
      object_id: 'test-obj',
      object_type: 'person',
      semantic_type: 'schema:Person',
      weight: 1,
      fields: {
        name: 'Test',
        imageGallery: ['Photos'],
        imageGalleryItem: [
          { album: 'Photos', url: 'https://example.com/a.jpg', rank_score: 100 },
        ],
      },
      previewGallery: [
        { url: 'https://example.com/a.jpg', rankScore: 100, isAvatar: false },
      ],
      galleryAlbums: [
        {
          name: 'Photos',
          items: [
            { url: 'https://example.com/a.jpg', rankScore: 100, isAvatar: false },
          ],
        },
      ],
      followers_count: 0,
      posts_count: 0,
      updates_count: 0,
      administrative_count: 0,
      ownership_count: 0,
      is_following: false,
      viewer_bell: false,
      update_type_counts: {},
    };

    const model = projectedObjectWithCountsToPageModel(api);

    expect(model.galleryAlbums).toEqual([
      {
        name: 'Photos',
        items: [
          { url: 'https://example.com/a.jpg', rankScore: 100, isAvatar: false },
        ],
      },
    ]);
    expect(model.previewGallery).toEqual([
      { url: 'https://example.com/a.jpg', rankScore: 100, isAvatar: false },
    ]);
    expect(model.onChainGalleryAlbumNames).toEqual(['Photos']);
  });

  it('omits left-rail gallery block when previewGallery is avatar-only', () => {
    const api: ProjectedObjectWithCountsView = {
      object_id: 'test-obj',
      object_type: 'person',
      semantic_type: 'schema:Person',
      weight: 1,
      fields: { name: 'Test' },
      previewGallery: [
        { url: 'https://example.com/avatar.jpg', rankScore: 100, isAvatar: true },
      ],
      galleryAlbums: [],
      followers_count: 0,
      posts_count: 0,
      updates_count: 0,
      administrative_count: 0,
      ownership_count: 0,
      is_following: false,
      viewer_bell: false,
      update_type_counts: {},
    };

    const model = projectedObjectWithCountsToPageModel(api);

    expect(model.leftRailBlocks.some((block) => block.kind === 'gallery')).toBe(false);
    expect(model.previewGallery).toHaveLength(1);
  });

  it('left-rail gallery block excludes avatar rows from carousel photos', () => {
    const api: ProjectedObjectWithCountsView = {
      object_id: 'test-obj',
      object_type: 'person',
      semantic_type: 'schema:Person',
      weight: 1,
      fields: { name: 'Test' },
      previewGallery: [
        { url: 'https://example.com/avatar.jpg', rankScore: 100, isAvatar: true },
        { url: 'https://example.com/a.jpg', rankScore: 90, isAvatar: false },
      ],
      galleryAlbums: [],
      followers_count: 0,
      posts_count: 0,
      updates_count: 0,
      administrative_count: 0,
      ownership_count: 0,
      is_following: false,
      viewer_bell: false,
      update_type_counts: {},
    };

    const model = projectedObjectWithCountsToPageModel(api);
    const galleryBlock = model.leftRailBlocks.find((block) => block.kind === 'gallery');

    expect(galleryBlock).toMatchObject({
      kind: 'gallery',
      photos: [{ url: 'https://example.com/a.jpg', rankScore: 90, isAvatar: false }],
    });
  });
});

describe('projectedObjectWithCountsToPageModel product left-rail order', () => {
  const baseCounts = {
    followers_count: 0,
    posts_count: 0,
    updates_count: 0,
    administrative_count: 0,
    ownership_count: 0,
    is_following: false,
    viewer_bell: false,
    update_type_counts: {},
  };

  it('places gallery, price, and options before description for product types', () => {
    const api: ProjectedObjectWithCountsView = {
      object_id: 'prod-1',
      object_type: 'product',
      semantic_type: 'schema:Product',
      weight: 1,
      fields: {
        name: 'Shoe',
        description: 'A great shoe',
        price: '$99',
      },
      previewGallery: [
        { url: 'https://example.com/shoe.jpg', rankScore: 100, isAvatar: false },
      ],
      galleryAlbums: [],
      ...baseCounts,
    };

    const optionsApi = {
      object_id: 'prod-1',
      options: {
        Color: [
          {
            object_id: 'prod-1',
            category: 'Color',
            value: 'Red',
            position: 0,
            image: null,
            price: null,
            imageUrl: null,
          },
        ],
      },
    };

    const model = projectedObjectWithCountsToPageModel(api, optionsApi);
    const kinds = model.leftRailBlocks.map((block) => block.kind);

    const galleryIdx = kinds.indexOf('gallery');
    const priceIdx = kinds.indexOf('price');
    const optionsIdx = kinds.indexOf('options');
    const descriptionIdx = kinds.indexOf('description');

    expect(galleryIdx).toBeGreaterThanOrEqual(0);
    expect(priceIdx).toBeGreaterThan(galleryIdx);
    expect(optionsIdx).toBeGreaterThan(priceIdx);
    expect(descriptionIdx).toBeGreaterThan(optionsIdx);
  });

  it('keeps gallery after tags for non-product types', () => {
    const api: ProjectedObjectWithCountsView = {
      object_id: 'place-1',
      object_type: 'restaurant',
      semantic_type: 'schema:Restaurant',
      weight: 1,
      fields: {
        name: 'Cafe',
        price: '$10',
        tagCategory: ['Cuisine'],
        tagCategoryItem: [{ value: 'Italian', category: 'Cuisine' }],
      },
      previewGallery: [
        { url: 'https://example.com/cafe.jpg', rankScore: 100, isAvatar: false },
      ],
      galleryAlbums: [],
      ...baseCounts,
    };

    const model = projectedObjectWithCountsToPageModel(api);
    const kinds = model.leftRailBlocks.map((block) => block.kind);

    const tagsIdx = kinds.indexOf('tags');
    const galleryIdx = kinds.indexOf('gallery');

    expect(tagsIdx).toBeGreaterThanOrEqual(0);
    expect(galleryIdx).toBeGreaterThan(tagsIdx);
  });
});
