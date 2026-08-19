import { Injectable } from '@nestjs/common';
import { MessagingRepository } from '../../repositories/messaging.repository';
import type { ChannelDetailDto } from './get-channel-by-id.endpoint';
import { GetChannelByIdEndpoint } from './get-channel-by-id.endpoint';

@Injectable()
export class GetChannelByAliasEndpoint {
  constructor(
    private readonly messagingRepo: MessagingRepository,
    private readonly getChannelById: GetChannelByIdEndpoint,
  ) {}

  async execute(alias: string, viewer?: string): Promise<ChannelDetailDto | null> {
    const channel = await this.messagingRepo.findChannelByAlias(alias.trim());
    if (!channel) {
      return null;
    }
    return this.getChannelById.execute(channel.channel_id, viewer);
  }
}
