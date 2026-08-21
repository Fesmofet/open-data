import { Injectable } from '@nestjs/common';
import {
  AccountsCurrentRepository,
  ObjectFavoriteRepository,
} from '../../repositories';

/**
 * Maintains `accounts_current.object_reputation` when `object_favorite` rows change.
 * @see docs/spec/social-account-ingestion.md §4.2
 */
@Injectable()
export class ObjectFavoriteReputationService {
  constructor(
    private readonly objectFavoriteRepository: ObjectFavoriteRepository,
    private readonly accountsCurrentRepository: AccountsCurrentRepository,
  ) {}

  async onFavoriteAdded(objectId: string, account: string, creator: string): Promise<void> {
    if (account === creator) {
      return;
    }

    const alreadyFavorited = await this.objectFavoriteRepository.exists(objectId, account);
    if (alreadyFavorited) {
      return;
    }

    const hadOtherFavorite = await this.objectFavoriteRepository.hasFavoriteByAccountForCreator(
      account,
      creator,
    );
    if (!hadOtherFavorite) {
      await this.accountsCurrentRepository.adjustObjectReputation(creator, 1);
    }
  }

  async onFavoriteRemoved(objectId: string, account: string, creator: string): Promise<void> {
    if (account === creator) {
      return;
    }

    const stillHasFavorite = await this.objectFavoriteRepository.hasFavoriteByAccountForCreator(
      account,
      creator,
      objectId,
    );
    if (!stillHasFavorite) {
      await this.accountsCurrentRepository.adjustObjectReputation(creator, -1);
    }
  }
}
