import { userProfileViewSchema } from '../../application/dto/user-profile.dto';
import type { UserProfileRepository } from '../../domain/ports/user-profile.repository';
import type { UserProfileView } from '../../domain/types/user-profile-view';
import { queryApiFetch, QUERY_API_LIVE_INIT } from '../clients/query-api.client';
import { queryApiCacheTags } from '@/shared/infrastructure/query/query-api-cache-tags';

function hasWobjectsWeight(data: unknown): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const row = data as Record<string, unknown>;
  return typeof row.wobjectsWeight === 'number' || typeof row.wobjects_weight === 'number';
}

function normalizeUserProfilePayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }
  const row = data as Record<string, unknown>;
  if (typeof row.wobjectsWeight === 'number') {
    return data;
  }
  if (typeof row.wobjects_weight === 'number') {
    return { ...row, wobjectsWeight: row.wobjects_weight };
  }
  return data;
}

export function createHttpUserProfileRepository(): UserProfileRepository {
  return {
    async findByName(
      name: string,
      viewer?: string | null,
      locale?: string | null,
    ): Promise<UserProfileView | null> {
      const path = `/query/v1/users/${encodeURIComponent(name)}/profile`;
      const viewerTrimmed = viewer?.trim();
      const headers: Record<string, string> = {};
      if (viewerTrimmed && viewerTrimmed.length > 0) {
        headers['X-Viewer'] = viewerTrimmed;
      }
      const localeTrimmed = locale?.trim();
      if (localeTrimmed && localeTrimmed.length > 0) {
        headers['X-Locale'] = localeTrimmed;
        headers['Accept-Language'] = localeTrimmed;
      }
      const fetchOpts = {
        headers,
        cacheTags: [queryApiCacheTags.userProfile(name)],
      };

      let data = await queryApiFetch<unknown>(path, fetchOpts);
      if (data === null) {
        return null;
      }

      if (!hasWobjectsWeight(data)) {
        const live = await queryApiFetch<unknown>(path, {
          ...fetchOpts,
          ...QUERY_API_LIVE_INIT,
          cacheTags: undefined,
        });
        if (live !== null) {
          data = live;
        }
      }

      const parsed = userProfileViewSchema.safeParse(normalizeUserProfilePayload(data));
      if (!parsed.success) {
        throw new Error(
          `Invalid user profile response: ${JSON.stringify(parsed.error.flatten())}`,
        );
      }
      return parsed.data;
    },
  };
}
