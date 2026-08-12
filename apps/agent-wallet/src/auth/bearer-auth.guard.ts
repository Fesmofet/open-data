import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AgentWalletAuthService } from './agent-wallet-auth.service';

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(private readonly auth: AgentWalletAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const authorized = this.auth.isAuthorized(req.headers.authorization);
    if (!authorized) {
      throw new UnauthorizedException('Invalid or missing bearer token');
    }
    return true;
  }
}
