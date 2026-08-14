import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type HiveSignerAccount = {
  username: string;
};

@Injectable()
export class HivesignerApiService {
  private readonly logger = new Logger(HivesignerApiService.name);

  constructor(private readonly config: ConfigService) {}

  async fetchAccount(accessToken: string): Promise<HiveSignerAccount> {
    const apiUrl = this.config.get<string>('hivesigner.apiUrl')?.trim();
    if (!apiUrl) {
      throw new ServiceUnavailableException('HiveSigner API is not configured');
    }

    const token = accessToken.trim();
    const url = new URL('/api/me', apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`);
    url.searchParams.set('access_token', token);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    } catch (error) {
      this.logger.error((error as Error).message);
      throw new ServiceUnavailableException('HiveSigner API unavailable');
    }

    if (response.status === 401 || response.status === 403) {
      throw new UnauthorizedException('Invalid HiveSigner access token');
    }

    if (!response.ok) {
      this.logger.error(`HiveSigner /api/me returned ${response.status}`);
      throw new ServiceUnavailableException('HiveSigner API unavailable');
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ServiceUnavailableException('HiveSigner API returned invalid JSON');
    }

    const account =
      typeof body === 'object' &&
      body !== null &&
      'account' in body &&
      typeof (body as { account?: { name?: unknown } }).account?.name ===
        'string'
        ? (body as { account: { name: string } }).account.name
        : null;

    if (!account?.trim()) {
      throw new UnauthorizedException('HiveSigner account name missing');
    }

    return {
      username: account.trim().toLowerCase().replace(/^@/, ''),
    };
  }
}
