import { parsePostingMetadata } from './parse-posting-metadata';
import { resolvePostingJsonMetadata } from './resolve-posting-json-metadata';
import type { UserProfileView } from './user-profile.types';
import { AccountCurrent } from '@opden-data-layer/odl-db-types';

export function mapAccountToUserProfileView(
  row: AccountCurrent,
  chainPostingJsonMetadata?: string | null,
): UserProfileView {
  const meta = parsePostingMetadata(
    resolvePostingJsonMetadata(row.posting_json_metadata, chainPostingJsonMetadata),
  );
  const aliasTrimmed = row.alias?.trim() ?? '';
  const metaName = meta?.profile.name?.trim() ?? '';
  const displayName =
    aliasTrimmed !== ''
      ? aliasTrimmed
      : metaName !== ''
        ? metaName
        : row.name;

  const bio = meta?.profile.about ?? '';

  const avatarFromColumn = row.profile_image?.trim() ?? '';
  const avatarFromMeta = meta?.profile.profile_image?.trim() ?? '';
  const avatarUrl =
    avatarFromColumn !== ''
      ? avatarFromColumn
      : avatarFromMeta !== ''
        ? avatarFromMeta
        : null;

  const coverTrimmed = meta?.profile.cover_image?.trim() ?? '';
  const coverImageUrl = coverTrimmed !== '' ? coverTrimmed : null;

  return {
    name: row.name,
    displayName,
    bio,
    avatarUrl,
    coverImageUrl,
    followerCount: row.followers_count,
    followingCount: row.users_following_count,
    postingCount: row.post_count,
    reputation: row.object_reputation,
    wobjectsWeight: row.wobjects_weight ?? 0,
    is_following: false,
    viewer_bell: false,
  };
}
