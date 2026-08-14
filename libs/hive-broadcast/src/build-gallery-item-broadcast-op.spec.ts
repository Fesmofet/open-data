import { buildGalleryItemBroadcastOp } from './build-gallery-item-broadcast-op';

describe('buildGalleryItemBroadcastOp', () => {
  const base = {
    id: 'odl-testnet',
    objectId: 'obj-1',
    creator: 'alice',
    itemValue: { album: 'Photos', cid: 'QmGalleryCid' },
  };

  it('ensures album when missing on chain', () => {
    const op = buildGalleryItemBroadcastOp({
      ...base,
      onChainGalleryAlbumNames: ['Menu'],
    });

    const parsed = JSON.parse(op.json) as {
      events: Array<{ action: string; payload: Record<string, unknown> }>;
    };
    expect(parsed.events).toHaveLength(2);
    expect(parsed.events[0]?.payload['update_type']).toBe('imageGallery');
    expect(parsed.events[1]?.payload['update_type']).toBe('imageGalleryItem');
  });

  it('uses single imageGalleryItem when album already exists', () => {
    const op = buildGalleryItemBroadcastOp({
      ...base,
      onChainGalleryAlbumNames: ['Photos', 'Menu'],
    });

    const parsed = JSON.parse(op.json) as {
      events: Array<{ action: string; payload: Record<string, unknown> }>;
    };
    expect(parsed.events).toHaveLength(1);
    expect(parsed.events[0]?.action).toBe('update_create');
    expect(parsed.events[0]?.payload['update_type']).toBe('imageGalleryItem');
  });
});
