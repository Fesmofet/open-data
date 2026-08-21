import { parsePostingMetadata } from './parse-posting-metadata';
import { resolvePostingJsonMetadata } from './resolve-posting-json-metadata';

export function resolveAvatarUrlFromHiveMetadata(input: {
  postingJsonMetadata?: string | null;
  jsonMetadata?: string | null;
  chainPostingJsonMetadata?: string | null;
  profileImageColumn?: string | null;
}): string | null {
  const postingRaw = resolvePostingJsonMetadata(
    input.postingJsonMetadata,
    input.chainPostingJsonMetadata,
  );
  const fromPosting = parsePostingMetadata(postingRaw)?.profile.profile_image?.trim() ?? '';
  if (fromPosting !== '') {
    return fromPosting;
  }

  const fromJson =
    parsePostingMetadata(input.jsonMetadata ?? null)?.profile.profile_image?.trim() ?? '';
  if (fromJson !== '') {
    return fromJson;
  }

  const fromColumn = input.profileImageColumn?.trim() ?? '';
  return fromColumn !== '' ? fromColumn : null;
}

export function avatarUrlFromJoinedAccountRow(row: {
  posting_json_metadata: string | null;
  json_metadata: string | null;
  profile_image: string | null;
}): string | null {
  return resolveAvatarUrlFromHiveMetadata({
    postingJsonMetadata: row.posting_json_metadata,
    jsonMetadata: row.json_metadata,
    profileImageColumn: row.profile_image,
  });
}
