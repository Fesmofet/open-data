import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OwnershipChangedEvent,
  OWNERSHIP_CHANGED_EVENT,
} from '../odl-parser/ownership-changed.event';
import { RankScoreService } from './rank-score.service';

@Injectable()
export class RankScoreOwnershipListener {
  constructor(private readonly rankScoreService: RankScoreService) {}

  @OnEvent(OWNERSHIP_CHANGED_EVENT)
  async handleOwnershipChanged(event: OwnershipChangedEvent): Promise<void> {
    const objectId = event.objectId.trim();
    if (objectId.length === 0) {
      return;
    }
    await this.rankScoreService.recalculateForObjectId(objectId);
  }
}
