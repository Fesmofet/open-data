import { Injectable, ForbiddenException } from '@nestjs/common';
import { MessagingRepository } from '../../repositories/messaging.repository';

export type MarkChannelReadResponseDto = {
  updated: boolean;
  last_read_at_unix: number;
};

@Injectable()
export class MarkChannelReadEndpoint {
  constructor(private readonly messagingRepo: MessagingRepository) {}

  async execute(
    channelId: string,
    viewer: string,
    lastReadAtUnix: number,
  ): Promise<MarkChannelReadResponseDto> {
    const viewerTrimmed = viewer.trim();
    const channel = await this.messagingRepo.findChannelById(channelId.trim());
    if (!channel) {
      throw new ForbiddenException('Not a channel member');
    }

    const isMember = await this.messagingRepo.isMember(channel.channel_id, viewerTrimmed);
    if (!isMember) {
      throw new ForbiddenException('Not a channel member');
    }

    const updated = await this.messagingRepo.setLastReadAt(
      channel.channel_id,
      viewerTrimmed,
      lastReadAtUnix,
    );

    const stored =
      (await this.messagingRepo.getMemberLastReadAt(channel.channel_id, viewerTrimmed)) ??
      lastReadAtUnix;

    return {
      updated,
      last_read_at_unix: stored,
    };
  }
}
