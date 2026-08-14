import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ChallengesRepository } from '../../repositories/challenges.repository';
import { HivesignerApiService } from '../providers/hivesigner-api.service';
import { IssueSessionService } from '../session/issue-session.service';
import type { JsonValue } from '../../database/types';

@Injectable()
export class HivesignerCallbackService {
  constructor(
    private readonly challenges: ChallengesRepository,
    private readonly hivesignerApi: HivesignerApiService,
    private readonly sessions: IssueSessionService,
  ) {}

  async execute(input: {
    accessToken: string;
    username: string;
    state?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const accessToken = input.accessToken?.trim();
    if (!accessToken) {
      throw new BadRequestException('access_token is required');
    }

    const state = input.state?.trim();
    if (!state) {
      throw new BadRequestException('state is required');
    }

    const challenge = await this.challenges.findActiveHivesignerByState(state);
    if (!challenge) {
      throw new UnauthorizedException('Invalid state');
    }
    if (challenge.used_at) {
      throw new UnauthorizedException('Challenge already used');
    }
    if (challenge.expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException('Challenge expired');
    }

    const verifiedAccount = await this.hivesignerApi.fetchAccount(accessToken);

    const expectedUser = challenge.hive_username.trim().toLowerCase();
    if (expectedUser && verifiedAccount.username !== expectedUser) {
      throw new UnauthorizedException('Hive account mismatch');
    }

    const queryUsername = input.username?.trim().toLowerCase().replace(/^@/, '');
    if (queryUsername && queryUsername !== verifiedAccount.username) {
      throw new UnauthorizedException('Hive account mismatch');
    }

    const marked = await this.challenges.markUsed(challenge.id, new Date());
    if (!marked) {
      throw new UnauthorizedException('Challenge already used');
    }

    const session = await this.sessions.issueForUser({
      username: verifiedAccount.username,
      provider: 'hivesigner',
      ip: input.ip,
      deviceInfo: input.userAgent ?? null,
      identityMetadata: { hivesignerOAuth: true } as unknown as JsonValue,
    });

    return {
      ...session,
      hsToken: accessToken,
    };
  }
}
