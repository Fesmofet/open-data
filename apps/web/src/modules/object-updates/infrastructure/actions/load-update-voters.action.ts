'use server';

import { unstable_noStore as noStore } from 'next/cache';

import type { UpdateVotersResponseView } from '../../application/dto/update-voters.dto';
import { fetchUpdateVoters } from '../clients/update-voters.client';

export async function loadUpdateVotersAction(
  objectId: string,
  updateId: string,
): Promise<UpdateVotersResponseView | null> {
  noStore();
  return fetchUpdateVoters(objectId, updateId);
}
