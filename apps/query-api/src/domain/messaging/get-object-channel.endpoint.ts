import { Injectable } from '@nestjs/common';
import { ObjectsCoreRepository, MessagingRepository } from '../../repositories';
import { GovernanceResolverService } from '../governance';
import { UserAccountMutesRepository } from '../../repositories';
import type { ChannelDetailDto } from './get-channel-by-id.endpoint';
import { GetChannelByIdEndpoint } from './get-channel-by-id.endpoint';
import type { MessageHistoryBody } from './schemas/messaging.schema';
import {
  GetChannelMessagesEndpoint,
  type MessageHistoryResponseDto,
} from './get-channel-messages.endpoint';

@Injectable()
export class GetObjectChannelEndpoint {
  constructor(
    private readonly objectsCoreRepo: ObjectsCoreRepository,
    private readonly messagingRepo: MessagingRepository,
    private readonly getChannelById: GetChannelByIdEndpoint,
  ) {}

  async execute(objectId: string, viewer?: string): Promise<ChannelDetailDto | null> {
    const trimmedId = objectId.trim();
    if (!trimmedId) {
      return null;
    }

    const core = await this.objectsCoreRepo.findByObjectIdForPage(trimmedId);
    if (!core) {
      return null;
    }

    const channel = await this.messagingRepo.findObjectChannel(trimmedId);
    if (!channel) {
      return null;
    }

    return this.getChannelById.execute(channel.channel_id, viewer);
  }
}

@Injectable()
export class GetObjectChannelMessagesEndpoint {
  constructor(
    private readonly objectsCoreRepo: ObjectsCoreRepository,
    private readonly messagingRepo: MessagingRepository,
    private readonly governanceResolver: GovernanceResolverService,
    private readonly userAccountMutesRepo: UserAccountMutesRepository,
    private readonly getChannelMessages: GetChannelMessagesEndpoint,
  ) {}

  async execute(
    objectId: string,
    body: MessageHistoryBody,
    governanceObjectIdFromHeader?: string,
    viewerAccount?: string,
  ): Promise<MessageHistoryResponseDto | null> {
    const trimmedId = objectId.trim();
    if (!trimmedId) {
      return null;
    }

    const core = await this.objectsCoreRepo.findByObjectIdForPage(trimmedId);
    if (!core) {
      return null;
    }

    const channel = await this.messagingRepo.findObjectChannel(trimmedId);
    if (!channel) {
      return null;
    }

    const governance = await this.governanceResolver.resolveMergedForObjectView(
      governanceObjectIdFromHeader,
    );

    const viewerTrimmed = viewerAccount?.trim() ?? '';
    const viewerMutes =
      viewerTrimmed.length > 0
        ? await this.userAccountMutesRepo.listMutedForMuters([viewerTrimmed])
        : [];

    const excludedAuthors = dedupeStrings([...governance.muted, ...viewerMutes]);

    return this.getChannelMessages.fetchMessages(
      channel.channel_id,
      body,
      excludedAuthors,
      body.for_context ? viewerTrimmed : undefined,
    );
  }
}

function dedupeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((v) => v.trim().length > 0))];
}
