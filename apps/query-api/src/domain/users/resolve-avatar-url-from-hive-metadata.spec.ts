import { resolveAvatarUrlFromHiveMetadata } from './resolve-avatar-url-from-hive-metadata';

describe('resolveAvatarUrlFromHiveMetadata', () => {
  it('prefers posting_json_metadata over json_metadata and profile_image column', () => {
    const url = resolveAvatarUrlFromHiveMetadata({
      postingJsonMetadata: JSON.stringify({
        profile: { profile_image: 'https://posting.test/a.jpg' },
      }),
      jsonMetadata: JSON.stringify({
        profile: { profile_image: 'https://json.test/b.jpg' },
      }),
      profileImageColumn: 'https://column.test/c.jpg',
    });
    expect(url).toBe('https://posting.test/a.jpg');
  });

  it('falls back to json_metadata when posting has no profile_image', () => {
    const url = resolveAvatarUrlFromHiveMetadata({
      postingJsonMetadata: JSON.stringify({ profile: { name: 'Alice' } }),
      jsonMetadata: JSON.stringify({
        profile: { profile_image: 'https://json.test/b.jpg' },
      }),
      profileImageColumn: 'https://column.test/c.jpg',
    });
    expect(url).toBe('https://json.test/b.jpg');
  });

  it('prefers chain posting_json_metadata over db posting_json_metadata', () => {
    const url = resolveAvatarUrlFromHiveMetadata({
      postingJsonMetadata: JSON.stringify({
        profile: { profile_image: 'https://db.test/a.jpg' },
      }),
      chainPostingJsonMetadata: JSON.stringify({
        profile: { profile_image: 'https://chain.test/a.jpg' },
      }),
      jsonMetadata: JSON.stringify({
        profile: { profile_image: 'https://json.test/b.jpg' },
      }),
    });
    expect(url).toBe('https://chain.test/a.jpg');
  });

  it('uses profile_image column when metadata has no image', () => {
    const url = resolveAvatarUrlFromHiveMetadata({
      postingJsonMetadata: '{}',
      jsonMetadata: null,
      profileImageColumn: 'https://column.test/c.jpg',
    });
    expect(url).toBe('https://column.test/c.jpg');
  });

  it('returns null when no avatar is available', () => {
    expect(resolveAvatarUrlFromHiveMetadata({})).toBeNull();
  });
});
