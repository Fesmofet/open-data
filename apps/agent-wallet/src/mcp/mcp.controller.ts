import { Controller, Delete, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';

import { BearerAuthGuard } from '../auth/bearer-auth.guard';
import { McpService } from './mcp.service';

@Controller({ path: 'mcp' })
@UseGuards(BearerAuthGuard)
export class McpController {
  constructor(private readonly mcp: McpService) {}

  @Get()
  rejectGet(@Res() res: Response): void {
    this.rejectStream(res);
  }

  @Delete()
  rejectDelete(@Res() res: Response): void {
    this.rejectStream(res);
  }

  private rejectStream(res: Response): void {
    res.status(405).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method Not Allowed: agent-wallet MCP is stateless (POST only)',
      },
      id: null,
    });
  }

  @Post()
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.mcp.handle(req, res);
  }
}
