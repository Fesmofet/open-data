import { Controller, Get, Inject } from '@nestjs/common';
import { KnowledgeRepository, type KnowledgeDatabase } from '@opden-data-layer/knowledge';
import type { Kysely } from 'kysely';
import { KYSELY } from '../database/database.module';

@Controller('health')
export class HealthController {
  constructor(@Inject(KYSELY) private readonly db: Kysely<KnowledgeDatabase>) {}

  @Get()
  async getHealth(): Promise<{
    status: string;
    index: { fileCount: number; ready: boolean };
  }> {
    const repo = new KnowledgeRepository(this.db);
    const fileCount = await repo.countFiles();
    return {
      status: 'ok',
      index: {
        fileCount,
        ready: fileCount > 0,
      },
    };
  }
}
