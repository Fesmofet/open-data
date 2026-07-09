type PostingProfileSlice = {
  name?: string;
  about?: string;
  profile_image?: string;
  cover_image?: string;
  location?: string;
  website?: string;
  email?: string;
  [key: string]: string | undefined;
};

export type ParsedPostingMetadata = {
  profile: PostingProfileSlice;
  /** All string entries from `profile` (social ids, wallets, etc.). */
  profileFields: Record<string, string>;
};

/**
 * Parses `posting_json_metadata` (Hive posting metadata JSON string).
 * Returns null on empty input or invalid JSON.
 */
export function parsePostingMetadata(
  raw: string | null,
): ParsedPostingMetadata | null {
  if (raw === null || raw.trim() === '') {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }
    const profileUnknown = (parsed as Record<string, unknown>).profile;
    if (typeof profileUnknown !== 'object' || profileUnknown === null) {
      return null;
    }
    const p = profileUnknown as Record<string, unknown>;
    const profile: PostingProfileSlice = {};
    const profileFields: Record<string, string> = {};
    for (const [key, value] of Object.entries(p)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        profileFields[key] = value.trim();
      }
    }
    if (typeof p.name === 'string') {
      profile.name = p.name;
    }
    if (typeof p.about === 'string') {
      profile.about = p.about;
    }
    if (typeof p.profile_image === 'string') {
      profile.profile_image = p.profile_image;
    }
    if (typeof p.cover_image === 'string') {
      profile.cover_image = p.cover_image;
    }
    if (typeof p.location === 'string') {
      profile.location = p.location;
    }
    if (typeof p.website === 'string') {
      profile.website = p.website;
    }
    if (typeof p.email === 'string') {
      profile.email = p.email;
    }
    return { profile, profileFields };
  } catch {
    return null;
  }
}
