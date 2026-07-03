import { Injectable } from '@nestjs/common';
import {
  AccountsCurrentRepository,
  UserObjectExpertiseRepository,
} from '../../repositories';
import type { UserExpertiseCountersResponse } from './expertise.schema';

@Injectable()
export class GetUserExpertiseCountersEndpoint {
  constructor(
    private readonly accounts: AccountsCurrentRepository,
    private readonly expertiseRepo: UserObjectExpertiseRepository,
  ) {}

  async execute(username: string): Promise<UserExpertiseCountersResponse | null> {
    const name = username.trim();
    if (name.length === 0) {
      return null;
    }

    const row = await this.accounts.findByName(name);
    if (!row) {
      return null;
    }

    const [hashtagsCount, objectsCount] = await Promise.all([
      this.expertiseRepo.countByScope(name, 'hashtags'),
      this.expertiseRepo.countByScope(name, 'objects'),
    ]);

    return { hashtagsCount, objectsCount };
  }
}
