import 'server-only';

import { queryApiFetchLive } from '@/modules/user-profile/infrastructure/clients/query-api.client';

import type { UpdateVotersResponseView } from '../../application/dto/update-voters.dto';

export async function fetchUpdateVoters(
  objectId: string,
  updateId: string,
): Promise<UpdateVotersResponseView | null> {
  const path = `/query/v1/objects/${encodeURIComponent(objectId)}/updates/${encodeURIComponent(updateId)}/voters`;
  return queryApiFetchLive<UpdateVotersResponseView>(path);
}
