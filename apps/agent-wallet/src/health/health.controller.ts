import { Controller, Get } from '@nestjs/common';

import { HasSessionService } from '../domain/has-session.service';

@Controller('health')
export class HealthController {
  constructor(private readonly hasSession: HasSessionService) {}

  @Get()
  getHealth(): {
    status: string;
    session: { active: boolean; account?: string; expiresAt?: number };
  } {
    const session = this.hasSession.getSessionInfo();
    return {
      status: 'ok',
      session: {
        active: session != null,
        ...(session ?? {}),
      },
    };
  }
}
