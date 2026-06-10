import { Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { McpService } from './mcp.service';

@Controller({ path: 'mcp' })
export class McpController {
  constructor(private readonly mcp: McpService) {}

  @Post()
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.mcp.handle(req, res);
  }
}
