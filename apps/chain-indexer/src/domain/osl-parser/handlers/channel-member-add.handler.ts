import { Injectable, Logger } from '@nestjs/common';
import {
  blockTimestampToUnixSeconds,
  CHANNEL_KINDS,
  CHANNEL_MEMBER_ROLES,
  MAX_GROUP_CHANNEL_MEMBERS,
} from '@opden-data-layer/core';
import { GovernanceResolverService } from '../../governance/governance-resolver.service';
import { ChannelsRepository } from '../../../repositories/channels.repository';
import { SocialGraphRepository } from '../../../repositories';
import type { OdlActionHandler, OdlEventContext } from '../../odl-shared';
import { canAddGroupMember } from '../group-member-eligibility';
import { channelMemberPayloadSchema } from '../osl-envelope.schema';

@Injectable()
export class ChannelMemberAddHandler implements OdlActionHandler {
  readonly action = 'channel_member_add';
  private readonly logger = new Logger(ChannelMemberAddHandler.name);

  constructor(
    private readonly channelsRepository: ChannelsRepository,
    private readonly socialGraphRepository: SocialGraphRepository,
    private readonly governanceResolver: GovernanceResolverService,
  ) {}

  async handle(payload: Record<string, unknown>, ctx: OdlEventContext): Promise<void> {
    const result = channelMemberPayloadSchema.safeParse(payload);
    if (!result.success) {
      this.logger.warn(
        `Invalid channel_member_add payload: ${result.error.message}`,
      );
      return;
    }

    const { channel_id, account } = result.data;
    const channel = await this.channelsRepository.findById(channel_id);
    if (!channel || channel.kind !== CHANNEL_KINDS[1]) {
      this.logger.warn(
        `channel_member_add: group channel '${channel_id}' not found; skipping`,
      );
      return;
    }

    if (channel.dissolved_at_unix != null) {
      this.logger.warn(
        `channel_member_add: channel '${channel_id}' is dissolved; skipping`,
      );
      return;
    }

    const role = await this.channelsRepository.getMemberRole(channel_id, ctx.creator);
    if (role !== CHANNEL_MEMBER_ROLES[0]) {
      this.logger.warn(
        `channel_member_add: '${ctx.creator}' is not admin of '${channel_id}'; skipping`,
      );
      return;
    }

    if (await this.channelsRepository.isMember(channel_id, account)) {
      this.logger.warn(
        `channel_member_add: '${account}' is already a member of '${channel_id}'; skipping`,
      );
      return;
    }

    const memberCount = await this.channelsRepository.countMembers(channel_id);
    if (memberCount >= MAX_GROUP_CHANNEL_MEMBERS) {
      this.logger.warn(
        `channel_member_add: channel '${channel_id}' is at member cap (${MAX_GROUP_CHANNEL_MEMBERS}); skipping`,
      );
      return;
    }

    const governance = await this.governanceResolver.resolveMergedForObjectView();
    const eligibility = await canAddGroupMember({
      adder: ctx.creator,
      target: account,
      governanceMutedAccounts: governance.muted,
      muteExists: (muter, muted) =>
        this.socialGraphRepository.muteExists(muter, muted),
    });
    if (!eligibility.ok) {
      this.logger.warn(
        `channel_member_add: cannot add '${account}' to '${channel_id}' (${eligibility.reason}); skipping`,
      );
      return;
    }

    const joinedAtUnix = blockTimestampToUnixSeconds(ctx.timestamp);
    await this.channelsRepository.insertMember({
      channel_id,
      account,
      role: CHANNEL_MEMBER_ROLES[1],
      joined_at_unix: joinedAtUnix,
    });
  }
}
