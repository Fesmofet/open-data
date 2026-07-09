/** Legacy `socialProfiles` ids (posting_json_metadata.profile keys). */
const SOCIAL_PROFILE_KEYS = [
  'facebook',
  'twitter',
  'youtube',
  'instagram',
  'tiktok',
  'snapchat',
  'github',
  'reddit',
  'telegram',
  'whatsapp',
  'pinterest',
  'twitch',
  'linkedin',
] as const;

export type UserAccountSidebarSocialLink = {
  type: string;
  value: string;
  href: string;
};

function buildSocialHref(type: string, value: string): string {
  const v = encodeURIComponent(value);
  switch (type) {
    case 'facebook':
      return `https://www.facebook.com/${v}`;
    case 'twitter':
      return `https://x.com/${v}`;
    case 'youtube':
      return `https://www.youtube.com/@${v}`;
    case 'instagram':
      return `https://instagram.com/${v}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${v}`;
    case 'snapchat':
      return `https://www.snapchat.com/add/${v}`;
    case 'github':
      return `https://github.com/${v}`;
    case 'reddit':
      return `https://www.reddit.com/user/${v}`;
    case 'telegram':
      return `https://t.me/${v}`;
    case 'whatsapp':
      return `https://wa.me/${v}`;
    case 'pinterest':
      return `https://www.pinterest.com/${v}`;
    case 'twitch':
      return `https://www.twitch.tv/${v}`;
    case 'linkedin':
      return `https://www.linkedin.com/in/${v}`;
    default:
      return `https://${value}`;
  }
}

/** Reads non-empty social ids from Hive `profile` slice (legacy SocialLinks). */
export function parseProfileSocialLinks(
  profile: Record<string, unknown> | undefined,
): UserAccountSidebarSocialLink[] {
  if (!profile) {
    return [];
  }
  const rows: UserAccountSidebarSocialLink[] = [];
  for (const type of SOCIAL_PROFILE_KEYS) {
    const raw = profile[type];
    if (typeof raw !== 'string') {
      continue;
    }
    const value = raw.trim();
    if (value.length === 0) {
      continue;
    }
    rows.push({
      type,
      value,
      href: buildSocialHref(type, value),
    });
  }
  return rows;
}
