import {
  GetObjectRelatedAlbumEndpoint,
  GetObjectRelatedAlbumPreviewEndpoint,
} from './get-object-related-album.endpoint';

describe('GetObjectRelatedAlbumPreviewEndpoint', () => {
  const support = { loadExcludedPostKeys: jest.fn() };
  const relatedImagesRepo = {
    countByObjectId: jest.fn(),
    findPreview: jest.fn(),
  };

  const endpoint = new GetObjectRelatedAlbumPreviewEndpoint(
    support as never,
    relatedImagesRepo as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when object is missing', async () => {
    support.loadExcludedPostKeys.mockResolvedValue(null);

    const result = await endpoint.execute('missing', { limit: 4 }, 'en-US');

    expect(result).toBeNull();
    expect(relatedImagesRepo.countByObjectId).not.toHaveBeenCalled();
  });

  it('returns preview DTO with excluded keys passed to repo', async () => {
    support.loadExcludedPostKeys.mockResolvedValue(['alice_p']);
    relatedImagesRepo.countByObjectId.mockResolvedValue(2);
    relatedImagesRepo.findPreview.mockResolvedValue([
      {
        image_url: 'https://img/1.jpg',
        author: 'bob',
        permlink: 'post',
      },
    ]);

    const result = await endpoint.execute('obj1', { limit: 4 }, 'en-US');

    expect(result).toEqual({
      count: 2,
      items: [
        {
          url: 'https://img/1.jpg',
          postAuthor: 'bob',
          postPermlink: 'post',
        },
      ],
    });
    expect(relatedImagesRepo.countByObjectId).toHaveBeenCalledWith('obj1', ['alice_p']);
    expect(relatedImagesRepo.findPreview).toHaveBeenCalledWith('obj1', 4, ['alice_p']);
  });
});

describe('GetObjectRelatedAlbumEndpoint', () => {
  const support = { loadExcludedPostKeys: jest.fn() };
  const relatedImagesRepo = {
    countByObjectId: jest.fn(),
    findPage: jest.fn(),
  };

  const endpoint = new GetObjectRelatedAlbumEndpoint(
    support as never,
    relatedImagesRepo as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    support.loadExcludedPostKeys.mockResolvedValue([]);
    relatedImagesRepo.countByObjectId.mockResolvedValue(5);
  });

  it('returns null when object is missing', async () => {
    support.loadExcludedPostKeys.mockResolvedValue(null);

    const result = await endpoint.execute('missing', { limit: 2 }, 'en-US');

    expect(result).toBeNull();
  });

  it('paginates with hasMore and next cursor', async () => {
    relatedImagesRepo.findPage.mockResolvedValue([
      { image_url: 'https://a/1.jpg', author: 'a', permlink: 'p1' },
      { image_url: 'https://a/2.jpg', author: 'a', permlink: 'p2' },
      { image_url: 'https://a/3.jpg', author: 'a', permlink: 'p3' },
    ]);

    const result = await endpoint.execute(
      'obj1',
      { limit: 2, cursor: '4' },
      'en-US',
    );

    expect(result).toEqual({
      count: 5,
      items: [
        { url: 'https://a/1.jpg', postAuthor: 'a', postPermlink: 'p1' },
        { url: 'https://a/2.jpg', postAuthor: 'a', postPermlink: 'p2' },
      ],
      hasMore: true,
      cursor: '6',
    });
    expect(relatedImagesRepo.findPage).toHaveBeenCalledWith('obj1', 3, 4, []);
  });

  it('treats invalid cursor as offset 0', async () => {
    relatedImagesRepo.findPage.mockResolvedValue([]);

    await endpoint.execute('obj1', { limit: 20, cursor: 'bad' }, 'en-US');

    expect(relatedImagesRepo.findPage).toHaveBeenCalledWith('obj1', 21, 0, []);
  });

  it('returns hasMore false when page is not full', async () => {
    relatedImagesRepo.findPage.mockResolvedValue([
      { image_url: 'https://a/1.jpg', author: 'a', permlink: 'p1' },
    ]);

    const result = await endpoint.execute('obj1', { limit: 20 }, 'en-US');

    expect(result?.hasMore).toBe(false);
    expect(result?.cursor).toBeNull();
  });
});
