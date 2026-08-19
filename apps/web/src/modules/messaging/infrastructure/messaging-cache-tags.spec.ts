import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

describe('messaging cache tags', () => {
  it('includes channel id in channel messages tag', () => {
    expect(queryApiCacheTags.channelMessages('dm-abc')).toContain('dm-abc');
    expect(queryApiCacheTags.channelMessages('dm-abc')).toContain('messaging');
  });
});
