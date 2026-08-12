import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';

import { BearerAuthGuard } from '../auth/bearer-auth.guard';
import { McpService } from './mcp.service';

@Controller({ path: 'mcp' })
@UseGuards(BearerAuthGuard)
export class McpController {
  constructor(private readonly mcp: McpService) {}

  @Post()
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.mcp.handle(req, res);
  }
}
