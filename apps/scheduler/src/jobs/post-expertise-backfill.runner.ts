import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JobHandlerContext } from './cron-job.types';
import { PostExpertiseService } from '../domain/post-expertise/post-expertise.service';
import { PostExpertiseRepository } from '../repositories/post-expertise.repository';

let runnerRef: PostExpertiseBackfillRunner | null = null;

function registerPostExpertiseBackfillRunner(r: PostExpertiseBackfillRunner): void {
  runnerRef = r;
}

export function getPostExpertiseBackfillRunnerForJob(): PostExpertiseBackfillRunner {
  if (!runnerRef) {
    throw new Error('PostExpertiseBackfillRunner is not registered yet');
  }
  return runnerRef;
}

@Injectable()
export class PostExpertiseBackfillRunner implements OnModuleInit {
  private readonly logger = new Logger(PostExpertiseBackfillRunner.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly postExpertiseRepository: PostExpertiseRepository,
    private readonly postExpertiseService: PostExpertiseService,
  ) {}

  onModuleInit(): void {
    registerPostExpertiseBackfillRunner(this);
  }

  private batchSize(): number {
    const raw = this.configService.get<number>('postExpertiseBackfill.batchSize', 100);
    return Number.isFinite(raw) && raw > 0 ? raw : 100;
  }

  async run(ctx: JobHandlerContext): Promise<void> {
    if (ctx.signal.aborted) {
      return;
    }

    const batchSize = this.batchSize();
    const posts = await this.postExpertiseRepository.findRootPostsPendingExpertise(
      batchSize,
    );

    let processed = 0;
    for (const post of posts) {
      if (ctx.signal.aborted) {
        return;
      }
      try {
        const ok = await this.postExpertiseService.applyForPostRow(post);
        if (ok) {
          processed += 1;
        }
      } catch (e) {
        this.logger.error(
          `expertise backfill failed ${post.author}/${post.permlink}: ${(e as Error).message}`,
        );
      }
    }

    if (processed > 0) {
      this.logger.log(`post-expertise-backfill: processed ${processed} post(s)`);
    }
  }
}
