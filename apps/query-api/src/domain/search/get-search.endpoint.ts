import { Injectable } from '@nestjs/common';

import { SearchRepository } from '../../repositories';
import { avatarUrlFromJoinedAccountRow } from '../users/resolve-avatar-url-from-hive-metadata';
import type {
  SearchResponseDto,
  SearchUserResult,
} from './search.types';
import { SearchObjectsDisplayService } from './search-objects-display.service';

/** Max user hits returned alongside object hits (profile list). */
const USER_SEARCH_LIMIT = 5;

export type SearchResultType = 'all' | 'objects' | 'users';

export interface GetSearchInput {
  q: string;
  locale: string;
  limit: number;
  type: SearchResultType;
  /** Optional `X-Viewer` for projection + follow status. */
  viewerAccount?: string;
  /** Optional `X-Governance-Object-Id` for governance merge in resolution/projection. */
  governanceObjectIdFromHeader?: string;
}

@Injectable()
export class GetSearchEndpoint {
  constructor(
    private readonly searchRepo: SearchRepository,
    private readonly searchObjectsDisplay: SearchObjectsDisplayService,
  ) {}

  async execute(input: GetSearchInput): Promise<SearchResponseDto> {
    const includeObjects = input.type !== 'users';
    const includeUsers = input.type !== 'objects';

    const [candidates, userRows] = await Promise.all([
      includeObjects
        ? this.searchRepo.searchObjects(input.q, input.limit)
        : Promise.resolve([]),
      includeUsers
        ? this.searchRepo.searchUsers(input.q, USER_SEARCH_LIMIT, input.viewerAccount)
        : Promise.resolve([]),
    ]);

    const objectIds = candidates.map((c) => c.object_id);

    const objectsOut = includeObjects && objectIds.length > 0
      ? await this.searchObjectsDisplay.projectByObjectIds(objectIds, {
          locale: input.locale,
          viewerAccount: input.viewerAccount,
          governanceObjectIdFromHeader: input.governanceObjectIdFromHeader,
        })
      : [];

    const users: SearchUserResult[] = userRows.map(
      (r): SearchUserResult => ({
        name: r.name,
        profile_image: avatarUrlFromJoinedAccountRow(r),
        reputation: r.object_reputation,
        wobjects_weight: r.wobjects_weight,
        followers_count: r.followers_count,
        is_following: r.is_following,
      }),
    );

    return {
      objects: objectsOut,
      users,
    };
  }
}
