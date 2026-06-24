import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { JwtAccessUser } from '@opden-data-layer/clients';
import { normalizeHiveAccount } from './normalize-hive-account';

@Injectable()
export class ViewerMatchesJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<
      Request & { user?: JwtAccessUser; body?: { viewer?: unknown } }
    >();
    const user = req.user;
    const viewerRaw = req.body?.viewer;
    if (viewerRaw === undefined || viewerRaw === null || viewerRaw === '') {
      return true;
    }
    if (!user?.sub || typeof viewerRaw !== 'string') {
      throw new ForbiddenException();
    }
    if (normalizeHiveAccount(viewerRaw) !== normalizeHiveAccount(user.sub)) {
      throw new ForbiddenException();
    }
    return true;
  }
}
