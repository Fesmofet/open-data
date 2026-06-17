import { buildHivePostImageMetadata } from './build-hive-post-image-metadata';

describe('buildHivePostImageMetadata', () => {
  it('emits https image URLs for Hive json_metadata.image', () => {
    const urls = buildHivePostImageMetadata(
      ['QmTest'],
      'https://ipfs.example',
      (cid) => `https://ipfs.example/ipfs/${cid}`,
    );
    expect(urls).toEqual(['https://ipfs.example/ipfs/QmTest']);
    for (const url of urls) {
      expect(url.startsWith('https://')).toBe(true);
      expect(url).not.toMatch(/^Qm/);
    }
  });
});
