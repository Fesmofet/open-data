import { Injectable } from '@nestjs/common';

import type { SearchObjectsByIdsBody } from './schemas/search-objects-by-ids.schema';
import type { SearchObjectsByIdsResponseDto } from './schemas/search-objects-by-ids.schema';
import { SearchObjectsDisplayService } from './search-objects-display.service';

export type GetSearchObjectsByIdsInput = SearchObjectsByIdsBody & {
  locale: string;
  viewerAccount?: string;
  governanceObjectIdFromHeader?: string;
};

function orderedUniqueObjectIds(objectIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of objectIds) {
    const id = raw.trim();
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    out.push(id);
  }
  return out;
}

@Injectable()
export class GetSearchObjectsByIdsEndpoint {
  constructor(private readonly searchObjectsDisplay: SearchObjectsDisplayService) {}

  async execute(input: GetSearchObjectsByIdsInput): Promise<SearchObjectsByIdsResponseDto> {
    const ids = orderedUniqueObjectIds(input.object_ids);
    const objects = await this.searchObjectsDisplay.projectByObjectIds(ids, {
      locale: input.locale,
      viewerAccount: input.viewerAccount,
      governanceObjectIdFromHeader: input.governanceObjectIdFromHeader,
    });
    return { objects };
  }
}
