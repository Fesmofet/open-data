import { GetSearchObjectsByIdsEndpoint } from './get-search-objects-by-ids.endpoint';
import type { SearchObjectsDisplayService } from './search-objects-display.service';

describe('GetSearchObjectsByIdsEndpoint', () => {
  it('dedupes ids and preserves first-seen order', async () => {
    const projectByObjectIds = jest.fn().mockResolvedValue([
      {
        object_id: 'a',
        object_type: 'hashtag',
        name: 'A',
        image_url: 'https://example.com/a.jpg',
        parent_name: null,
      },
      {
        object_id: 'b',
        object_type: 'restaurant',
        name: 'B',
        image_url: null,
        parent_name: 'Parent',
      },
    ]);
    const display = { projectByObjectIds } as unknown as SearchObjectsDisplayService;
    const endpoint = new GetSearchObjectsByIdsEndpoint(display);

    const result = await endpoint.execute({
      object_ids: ['b', 'a', 'b', '  a  '],
      locale: 'en-US',
    });

    expect(projectByObjectIds).toHaveBeenCalledWith(['b', 'a'], {
      locale: 'en-US',
      viewerAccount: undefined,
      governanceObjectIdFromHeader: undefined,
    });
    expect(result.objects).toHaveLength(2);
    expect(result.objects[0]?.object_id).toBe('a');
    expect(result.objects[0]?.image_url).toBe('https://example.com/a.jpg');
  });

  it('returns empty objects when display yields none', async () => {
    const display = {
      projectByObjectIds: jest.fn().mockResolvedValue([]),
    } as unknown as SearchObjectsDisplayService;
    const endpoint = new GetSearchObjectsByIdsEndpoint(display);

    const result = await endpoint.execute({
      object_ids: ['missing-id'],
      locale: 'en-US',
    });

    expect(result).toEqual({ objects: [] });
  });
});
