import { Injectable } from '@nestjs/common';

import { resolveVoterPrivilegedTier } from '@opden-data-layer/objects-domain';

import { AccountsCurrentRepository, ObjectAuthorityRepository, ObjectUpdatesRepository, UpdatesFeedRepository } from '../../repositories';
import { GovernanceResolverService } from '../governance';
import { mapAccountToUserProfileView } from '../users/account-mapper';
import {
  resolveLatestValidityVoters,
  VALIDITY_VOTER_LIST_LIMIT,
  type ResolvedValidityVoterEntry,
} from './resolve-latest-validity-votes';
import type { UpdateVoterRowDto, UpdateVotersResponseDto } from './schemas/update-voters.schema';

export type GetUpdateVotersInput = {
  objectId: string;
  updateId: string;
  governanceObjectIdFromHeader?: string;
};

@Injectable()
export class GetUpdateVotersEndpoint {
  constructor(
    private readonly objectUpdates: ObjectUpdatesRepository,
    private readonly updatesFeedRepo: UpdatesFeedRepository,
    private readonly accounts: AccountsCurrentRepository,
    private readonly objectAuthorityRepo: ObjectAuthorityRepository,
    private readonly governanceResolver: GovernanceResolverService,
  ) {}

  async execute(input: GetUpdateVotersInput): Promise<UpdateVotersResponseDto | null> {
    const { objectId, updateId, governanceObjectIdFromHeader } = input;
    const rows = await this.objectUpdates.find({
      object_id: objectId,
      update_id: updateId,
    });
    if (rows.length === 0) {
      return null;
    }

    const [governance, authorities] = await Promise.all([
      this.governanceResolver.resolveMergedForObjectView(governanceObjectIdFromHeader),
      this.objectAuthorityRepo.findByObjectId(objectId),
    ]);

    const votes = await this.updatesFeedRepo.findValidityVotesForObjectAndUpdates(objectId, [
      updateId,
    ]);
    const { forVoters, againstVoters } = resolveLatestValidityVoters(votes);

    const cappedFor = forVoters.slice(0, VALIDITY_VOTER_LIST_LIMIT);
    const cappedAgainst = againstVoters.slice(0, VALIDITY_VOTER_LIST_LIMIT);
    const allNames = [
      ...new Set([...cappedFor, ...cappedAgainst].map((entry) => entry.voter)),
    ];
    const [accountRows, waivPowers] = await Promise.all([
      this.accounts.findByNames(allNames),
      this.updatesFeedRepo.findWaivPowersByAccounts(allNames),
    ]);
    const profileByName = new Map(
      accountRows.map((row) => [row.name, mapAccountToUserProfileView(row)]),
    );

    const toRow = (entry: ResolvedValidityVoterEntry): UpdateVoterRowDto => {
      const profile = profileByName.get(entry.voter);
      return {
        voter: entry.voter,
        event_seq: entry.event_seq.toString(),
        waiv_power: waivPowers.get(entry.voter) ?? 0,
        privileged_tier: resolveVoterPrivilegedTier(entry.voter, governance, authorities),
        profile: {
          name: entry.voter,
          displayName: profile?.displayName ?? null,
          avatarUrl: profile?.avatarUrl ?? null,
        },
      };
    };

    return {
      for_count: forVoters.length,
      against_count: againstVoters.length,
      for_voters: cappedFor.map(toRow),
      against_voters: cappedAgainst.map(toRow),
    };
  }
}
