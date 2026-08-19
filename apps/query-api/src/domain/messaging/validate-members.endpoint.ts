import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CHANNEL_MEMBER_ROLES } from '@opden-data-layer/core';
import { GovernanceResolverService } from '../governance/governance-resolver.service';
import { MessagingRepository } from '../../repositories/messaging.repository';
import { UserAccountMutesRepository } from '../../repositories/user-account-mutes.repository';
import {
  evaluateAddableMembers,
  type ValidateMemberResult,
} from './group-member-validation';

export type ValidateChannelMembersResponseDto = {
  results: ValidateMemberResult[];
};

@Injectable()
export class ValidateChannelMembersEndpoint {
  constructor(
    private readonly messagingRepo: MessagingRepository,
    private readonly userAccountMutesRepo: UserAccountMutesRepository,
    private readonly governanceResolver: GovernanceResolverService,
  ) {}

  async execute(
    channelId: string,
    viewer: string,
    accounts: readonly string[],
  ): Promise<ValidateChannelMembersResponseDto> {
    const viewerTrimmed = viewer.trim();
    if (!viewerTrimmed) {
      throw new ForbiddenException('Viewer required');
    }

    const channel = await this.messagingRepo.findChannelById(channelId.trim());
    if (!channel || channel.dissolved_at_unix != null) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.kind !== 'group') {
      throw new ForbiddenException('Group channel required');
    }

    const role = await this.messagingRepo.getMemberRole(channel.channel_id, viewerTrimmed);
    if (role !== CHANNEL_MEMBER_ROLES[0]) {
      throw new ForbiddenException('Admin required');
    }

    const members = await this.messagingRepo.listMembers(channel.channel_id);
    const existingMemberAccounts = new Set(members.map((member) => member.account));
    const governance = await this.governanceResolver.resolveMergedForObjectView();

    const results = await evaluateAddableMembers({
      adder: viewerTrimmed,
      accounts,
      governanceMutedAccounts: governance.muted,
      existingMemberAccounts,
      currentMemberCount: members.length,
      muteExists: (muter, muted) =>
        this.userAccountMutesRepo.muteExists(muter, muted),
    });

    return { results };
  }
}

/**
 * Preflight for new group create (no channel yet): viewer is adder, cap includes creator.
 */
@Injectable()
export class ValidateGroupInviteesEndpoint {
  constructor(
    private readonly userAccountMutesRepo: UserAccountMutesRepository,
    private readonly governanceResolver: GovernanceResolverService,
  ) {}

  async execute(
    viewer: string,
    accounts: readonly string[],
  ): Promise<ValidateChannelMembersResponseDto> {
    const viewerTrimmed = viewer.trim();
    if (!viewerTrimmed) {
      throw new ForbiddenException('Viewer required');
    }

    const governance = await this.governanceResolver.resolveMergedForObjectView();
    const existingMemberAccounts = new Set<string>([viewerTrimmed]);

    const results = await evaluateAddableMembers({
      adder: viewerTrimmed,
      accounts,
      governanceMutedAccounts: governance.muted,
      existingMemberAccounts,
      currentMemberCount: 1,
      muteExists: (muter, muted) =>
        this.userAccountMutesRepo.muteExists(muter, muted),
    });

    return { results };
  }
}
